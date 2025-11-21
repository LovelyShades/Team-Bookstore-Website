import { supabase } from '@/integrations/supabase/client';
import { ShippingAddress } from '@/types';

export interface CreateShippingAddressData {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  phone?: string;
  is_default?: boolean;
}

export interface UpdateShippingAddressData {
  label?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  is_default?: boolean;
}

export const shippingAddressService = {
  // Get all shipping addresses for the current user
  async getUserShippingAddresses(profileId: string): Promise<ShippingAddress[]> {
    try {
      const { data, error } = await supabase
        .from('shipping_addresses')
        .select('*')
        .eq('profile_id', profileId)
        .is('deleted_at', null)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching shipping addresses:', error);
        return [];
      }
      return (data || []) as ShippingAddress[];
    } catch (error) {
      console.error('Error in getUserShippingAddresses:', error);
      return [];
    }
  },

  // Get the default shipping address for a user
  async getDefaultShippingAddress(profileId: string): Promise<ShippingAddress | null> {
    try {
      const { data, error } = await supabase
        .from('shipping_addresses')
        .select('*')
        .eq('profile_id', profileId)
        .eq('is_default', true)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Not found error
          console.error('Error fetching default shipping address:', error);
        }
        return null;
      }
      return data as ShippingAddress;
    } catch (error) {
      console.error('Error in getDefaultShippingAddress:', error);
      return null;
    }
  },

  // Create a new shipping address
  async createShippingAddress(profileId: string, addressData: CreateShippingAddressData): Promise<ShippingAddress | null> {
    try {
      // If this is set as default, first remove default from other addresses
      if (addressData.is_default) {
        await this.clearDefaultAddress(profileId);
      }

      const { data, error } = await supabase
        .from('shipping_addresses')
        .insert({
          profile_id: profileId,
          ...addressData,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating shipping address:', error);
        return null;
      }
      return data as ShippingAddress;
    } catch (error) {
      console.error('Error in createShippingAddress:', error);
      return null;
    }
  },

  // Update an existing shipping address
  async updateShippingAddress(addressId: string, addressData: UpdateShippingAddressData): Promise<ShippingAddress | null> {
    try {
      // If this is being set as default, first remove default from other addresses
      if (addressData.is_default) {
        const { data: currentAddress } = await supabase
          .from('shipping_addresses')
          .select('profile_id')
          .eq('id', addressId)
          .single();

        if (currentAddress) {
          await this.clearDefaultAddress(currentAddress.profile_id);
        }
      }

      const { data, error } = await supabase
        .from('shipping_addresses')
        .update(addressData)
        .eq('id', addressId)
        .select()
        .single();

      if (error) {
        console.error('Error updating shipping address:', error);
        return null;
      }
      return data as ShippingAddress;
    } catch (error) {
      console.error('Error in updateShippingAddress:', error);
      return null;
    }
  },

  // Soft delete a shipping address
  async deleteShippingAddress(addressId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('shipping_addresses')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', addressId)
        .select();

      if (error) {
        console.error('Error deleting shipping address:', error);
        return false;
      }
      
      return data && data.length > 0;
    } catch (error) {
      console.error('Error in deleteShippingAddress:', error);
      return false;
    }
  },

  // Set an address as the default
  async setDefaultAddress(addressId: string): Promise<boolean> {
    try {
      // First get the profile_id for this address
      const { data: address } = await supabase
        .from('shipping_addresses')
        .select('profile_id')
        .eq('id', addressId)
        .single();

      if (!address) return false;

      // Clear existing default
      await this.clearDefaultAddress(address.profile_id);

      // Set new default
      const { error } = await supabase
        .from('shipping_addresses')
        .update({ is_default: true })
        .eq('id', addressId);

      if (error) {
        console.error('Error setting default address:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error in setDefaultAddress:', error);
      return false;
    }
  },

  // Clear default status from all addresses for a user
  async clearDefaultAddress(profileId: string): Promise<void> {
    try {
      await supabase
        .from('shipping_addresses')
        .update({ is_default: false })
        .eq('profile_id', profileId)
        .eq('is_default', true);
    } catch (error) {
      console.error('Error clearing default addresses:', error);
    }
  },

  // Format address for display
  formatAddress(address: ShippingAddress, includePhone = false): string {
    const parts = [
      address.line1,
      address.line2,
      `${address.city}${address.state ? `, ${address.state}` : ''} ${address.postal_code}`,
      address.country,
    ].filter(Boolean);

    if (includePhone && address.phone) {
      parts.push(address.phone);
    }

    return parts.join('\n');
  },

  // Validate address data
  validateAddress(addressData: CreateShippingAddressData | UpdateShippingAddressData): string[] {
    const errors: string[] = [];

    if ('line1' in addressData && !addressData.line1?.trim()) {
      errors.push('Address line 1 is required');
    }
    if ('city' in addressData && !addressData.city?.trim()) {
      errors.push('City is required');
    }
    if ('postal_code' in addressData && !addressData.postal_code?.trim()) {
      errors.push('Postal code is required');
    }
    if ('country' in addressData && !addressData.country?.trim()) {
      errors.push('Country is required');
    }

    return errors;
  },
};