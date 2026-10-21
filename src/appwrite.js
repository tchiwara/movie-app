import { Client, TablesDB, ID, Query } from 'appwrite'

const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const TABLE_ID = import.meta.env.VITE_APPWRITE_TABLE_ID; // same ID as your old collection
const ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT;

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID);

const tablesDB = new TablesDB(client);

export const updateSearchCount = async (debouncedSearchTerm, movie) => {
    // Normalize so "Venom", "venom " and "VENOM" count as the same search
    const term = debouncedSearchTerm.trim().toLowerCase();

    // Skip very short terms, they are usually half-typed searches
    if (term.length < 3) return;

    // 1. Use Appwrite SDK to check if the search term exists in the database
    try {
        const result = await tablesDB.listRows({
            databaseId: DATABASE_ID,
            tableId: TABLE_ID,
            queries: [Query.equal('searchTerm', term)],
        });

        // 2. If it does, update the count
        if (result.rows.length > 0) {
            const row = result.rows[0];
            await tablesDB.updateRow({
                databaseId: DATABASE_ID,
                tableId: TABLE_ID,
                rowId: row.$id,
                data: { count: row.count + 1 },
            });
            // 3. If it doesn't, create a new row with the search term and count as 1
        } else {
            await tablesDB.createRow({
                databaseId: DATABASE_ID,
                tableId: TABLE_ID,
                rowId: ID.unique(),
                data: {
                    searchTerm: term,
                    count: 1,
                    movie_id: movie.id,
                    poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
                },
            });
        }
    } catch (error) {
        console.error('Failed to update search count:', error.message);
    }
};

export const getTrendingMovies = async () => {
    try {
        // Get the 5 most searched rows, highest count first
        const result = await tablesDB.listRows({
            databaseId: DATABASE_ID,
            tableId: TABLE_ID,
            queries: [
                Query.limit(5),
                Query.orderDesc('count'),
            ],
        });

        return result.rows;
    } catch (error) {
        console.error('Failed to fetch trending movies:', error.message);
        // Return an empty list so the UI can still render without trending
        return [];
    }
};