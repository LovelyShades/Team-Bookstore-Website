import { OpenLibraryBook } from "@/types";

/**
 * Unified Book Metadata Service (Google Books + fallback-ready)
 * ------------------------------------------------------------
 * Fetches title, author, publisher, description, pages, ISBN, and cover
 * directly from Google Books in one fast request (~300ms).
 * 
 * Optional: can later add Open Library fallback if no Google match found.
 */

interface GoogleBooksResponse {
  items?: GoogleBookItem[];
}

interface GoogleBookItem {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    pageCount?: number;
    industryIdentifiers?: Array<{ type: string; identifier: string }>;
    imageLinks?: {
      smallThumbnail?: string;
      thumbnail?: string;
      medium?: string;
      large?: string;
      extraLarge?: string;
    };
  };
}

export const bookService = {
  // 🔍 Search Google Books by title, author, keyword, or ISBN
  async searchBooks(query: string): Promise<OpenLibraryBook[]> {
    if (!query.trim()) return [];

    const API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_KEY || "";
    const url = new URL("https://www.googleapis.com/books/v1/volumes");
    url.searchParams.set("q", query);
    url.searchParams.set("maxResults", "20");
    if (API_KEY) url.searchParams.set("key", API_KEY);

    try {
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Google Books API error: ${res.status}`);
      const data: GoogleBooksResponse = await res.json();
      if (!data.items) return [];

      // ✅ Map Google Books response to our unified book model
      const mapped = data.items.map((item) => {
        const info = item.volumeInfo;
        const isbn =
          info.industryIdentifiers?.find((id) => id.type === "ISBN_13")?.identifier ||
          info.industryIdentifiers?.find((id) => id.type === "ISBN_10")?.identifier ||
          null;

        const image =
          info.imageLinks?.extraLarge ||
          info.imageLinks?.large ||
          info.imageLinks?.medium ||
          info.imageLinks?.thumbnail ||
          info.imageLinks?.smallThumbnail ||
          null;

        const publishYear = info.publishedDate ? info.publishedDate.slice(0, 4) : null;

        return {
          key: item.id,
          title: info.title,
          author_name: info.authors || ["Unknown Author"],
          publisher: info.publisher ? [info.publisher] : [],
          publish_year: publishYear ? [parseInt(publishYear)] : [],
          first_publish_year: publishYear ? parseInt(publishYear) : null,
          number_of_pages: info.pageCount || null,
          isbn: isbn ? [isbn] : [],
          cover_i: image ? 1 : null,
          cover: image ? { large: image } : undefined,
          description: info.description || "",
        } as OpenLibraryBook;
      });

      // Only return books with covers + ISBN + publisher
      return mapped.filter(
        (b) =>
          b.cover &&
          b.cover.large &&
          b.isbn?.length &&
          b.publisher?.length &&
          b.title?.length
      );
    } catch (error) {
      console.error("Error fetching from Google Books:", error);
      return [];
    }
  },

  // 📗 Fetch detailed metadata by ISBN (single)
  async getBookDetailsByISBN(isbn: string) {
    const API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_KEY || "";
    const url = new URL("https://www.googleapis.com/books/v1/volumes");
    url.searchParams.set("q", `isbn:${isbn}`);
    if (API_KEY) url.searchParams.set("key", API_KEY);

    try {
      const res = await fetch(url.toString());
      if (!res.ok) return null;
      const data: GoogleBooksResponse = await res.json();
      if (!data.items?.length) return null;

      const info = data.items[0].volumeInfo;
      const isbn13 =
        info.industryIdentifiers?.find((id) => id.type === "ISBN_13")?.identifier || isbn;
      
      const image =
        info.imageLinks?.extraLarge ||
        info.imageLinks?.large ||
        info.imageLinks?.medium ||
        info.imageLinks?.thumbnail ||
        null;

      return {
        title: info.title,
        author_name: info.authors || ["Unknown Author"],
        publisher: info.publisher ? [info.publisher] : [],
        publish_year: info.publishedDate ? [parseInt(info.publishedDate.slice(0, 4))] : [],
        number_of_pages: info.pageCount || null,
        isbn: [isbn13],
        description: info.description || "",
        cover: image ? { large: image } : {},
      };
    } catch (error) {
      console.error("Error fetching Google Books details:", error);
      return null;
    }
  },

  // 💾 Same formatter you already use for Supabase
  formatBookForDatabase(book: OpenLibraryBook) {
    const isbn = book.isbn?.[0] || null;
    const isbn10 = book.isbn?.find((i) => i.length === 10) || null;
    const image = book.cover?.large || null;

    return {
      name: book.title,
      author: book.author_name?.[0] || "Unknown Author",
      isbn,
      isbn_10: isbn10,
      img_url: image,
      hero_img_url: image,
      publish_year: book.first_publish_year || book.publish_year?.[0] || null,
      publisher: book.publisher?.[0] || null,
      page_count: book.number_of_pages || null,
      description: book.description || null,
      open_library_id: book.key || null,
    };
  },
};
