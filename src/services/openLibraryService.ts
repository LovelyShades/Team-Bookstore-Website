import { OpenLibraryBook } from "@/types";

interface OpenLibrarySearchResponse {
  docs: OpenLibraryBook[];
  numFound: number;
}

export const openLibraryService = {
  // ⚡ Smart, fast, batched version
  async searchBooks(query: string): Promise<OpenLibraryBook[]> {
    if (!query.trim()) return [];

    const results: OpenLibraryBook[] = [];
    const MAX_PAGES = 5;
    const LIMIT = 100;
    const BATCH_SIZE = 20;

    // ✅ Verify completeness (skip placeholders and missing data)
    const isCompleteBook = (book: any): boolean => {
      const hasCover = !!(
        (book.cover_i && Number.isInteger(book.cover_i)) ||
        (book.cover?.large && book.cover.large.includes("covers.openlibrary.org"))
      );
      return (
        hasCover &&
        book.isbn &&
        book.isbn.length > 0 &&
        book.publisher &&
        book.publisher.length > 0 &&
        book.number_of_pages &&
        (book.first_publish_year || (book.publish_year && book.publish_year.length > 0))
      );
    };

    // 📚 Batch enrich 20 ISBNs at a time
    const enrichBooksBatch = async (isbns: string[]) => {
      const bibkeys = isbns.map((isbn) => `ISBN:${isbn}`).join(",");
      const url = `https://openlibrary.org/api/books?bibkeys=${bibkeys}&jscmd=data&format=json`;
      try {
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();

        return Object.entries(data).map(([key, entry]: [string, any]) => {
          const isbn = key.replace("ISBN:", "");
          return {
            title: entry.title,
            author_name: entry.authors?.map((a: any) => a.name) || [],
            publisher: entry.publishers?.map((p: any) => p.name) || [],
            number_of_pages: entry.number_of_pages,
            publish_year: entry.publish_date ? [parseInt(entry.publish_date)] : [],
            isbn: [isbn],
            cover_i: entry.cover?.large || null,
            cover: entry.cover,
            key: entry.key,
          } as OpenLibraryBook;
        });
      } catch (e) {
        console.error("Batch enrichment error:", e);
        return [];
      }
    };

    try {
      let page = 1;

      while (results.length < 20 && page <= MAX_PAGES) {
        const searchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(
          query,
        )}&limit=${LIMIT}&page=${page}&fields=key,title,author_name,isbn,cover_i,publisher,first_publish_year,publish_year`;
        const res = await fetch(searchUrl);
        if (!res.ok) break;

        const data: OpenLibrarySearchResponse = await res.json();
        if (!data.docs?.length) break;

        // Collect unique ISBNs to enrich
        const isbnList = data.docs
          .flatMap((b) => b.isbn || [])
          .filter((v, i, arr) => arr.indexOf(v) === i)
          .slice(0, 80); // limit total batch size per page

        // Run batched API calls in parallel
        const batchedResults: OpenLibraryBook[] = [];
        for (let i = 0; i < isbnList.length; i += BATCH_SIZE) {
          const batch = isbnList.slice(i, i + BATCH_SIZE);
          const enriched = await enrichBooksBatch(batch);
          batchedResults.push(...enriched);
        }

        // Combine enriched data with the original search results
        const enrichedMap = new Map(batchedResults.map((b) => [b.isbn?.[0], b]));
        const mergedBooks = data.docs.map((book) => {
          const isbn = book.isbn?.[0];
          if (isbn && enrichedMap.has(isbn)) {
            return { ...book, ...enrichedMap.get(isbn) };
          }
          return book;
        });

        // Filter for complete books only
        const completeBooks = mergedBooks.filter(isCompleteBook);
        results.push(...completeBooks);

        if (data.docs.length < LIMIT) break;
        page++;
      }

      return results.slice(0, 20);
    } catch (error) {
      console.error("Error searching Open Library:", error);
      return [];
    }
  },

  // 🖼️ Cover generator
  getCoverUrl(identifier: string | number, size: "S" | "M" | "L" = "L", type: "isbn" | "id" = "isbn"): string {
    return `https://covers.openlibrary.org/b/${type}/${identifier}-${size}.jpg`;
  },

  // 💾 Format book for DB
  formatBookForDatabase(book: OpenLibraryBook) {
    const isbn = book.isbn?.[0] || null;
    const isbn10 = book.isbn?.find((i) => i.length === 10) || null;
    const coverId = book.cover_i;

    let imgUrl: string | null = null;
    let heroImgUrl: string | null = null;

    if (isbn) {
      imgUrl = this.getCoverUrl(isbn, "M", "isbn");
      heroImgUrl = this.getCoverUrl(isbn, "L", "isbn");
    } else if (coverId) {
      imgUrl = this.getCoverUrl(coverId, "M", "id");
      heroImgUrl = this.getCoverUrl(coverId, "L", "id");
    }

    return {
      name: book.title,
      author: book.author_name?.[0] || "Unknown Author",
      isbn,
      isbn_10: isbn10,
      img_url: imgUrl,
      hero_img_url: heroImgUrl,
      publish_year: book.first_publish_year || book.publish_year?.[0] || null,
      publisher: book.publisher?.[0] || null,
      page_count: book.number_of_pages || null,
      open_library_id: book.key || null,
    };
  },
};
