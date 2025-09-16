// Database service for Neon PostgreSQL
import { neon } from '@neondatabase/serverless';
import { Ad } from '../types/Ad';

export class DatabaseService {
  private sql: ReturnType<typeof neon>;

  constructor() {
    let databaseUrl = import.meta.env.VITE_DATABASE_URL || 'postgresql://manyerere201:exHjyP9UQFX0@ep-shy-mud-a5gs0r74-pooler.us-east-2.aws.neon.tech/adzone?sslmode=require&channel_binding=require';

    // Try to encode the password if it contains special characters
    try {
      const url = new URL(databaseUrl);
      if (url.password && url.password.includes('@')) {
        console.log('Password contains @ character, encoding it...');
        const encodedPassword = encodeURIComponent(url.password);
        databaseUrl = databaseUrl.replace(url.password, encodedPassword);
        console.log('Encoded database URL');
      }
    } catch (e) {
      console.error('Error encoding database URL:', e);
    }

    console.log('Database URL:', databaseUrl ? 'Set' : 'Not set');
    console.log('Database URL length:', databaseUrl.length);
    console.log('Database URL starts with:', databaseUrl.substring(0, 20) + '...');

    // Test the URL format
    try {
      const url = new URL(databaseUrl);
      console.log('Database URL is valid format');
      console.log('Host:', url.host);
      console.log('Database:', url.pathname.substring(1));
      console.log('Username present:', url.username ? 'Yes' : 'No');
      console.log('Password present:', url.password ? 'Yes' : 'No');
    } catch (e) {
      console.error('Database URL format is invalid:', e);
    }

    this.sql = neon(databaseUrl);
    this.testConnection();
  }

  private async testConnection() {
    try {
      console.log('Testing database connection...');
      const result = await this.sql`SELECT version()`;
      console.log('Database version:', result);
      console.log('Connection test successful!');
    } catch (error) {
      console.error('Database connection failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Connection error details:', errorMessage);
    }
  }

  private async initializeDatabase() {
    try {
      console.log('Initializing database...');
      // Test connection first
      const testResult = await this.sql`SELECT 1 as test`;
      console.log('Database connection successful, test result:', testResult);

      // Check if table exists and what its structure is
      try {
        const tableCheck = await this.sql`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'ads'
          ORDER BY ordinal_position
        `;
        console.log('Existing table structure:', tableCheck);
      } catch {
        console.log('Table does not exist yet, will create it');
      }

      // Create ads table if it doesn't exist
      await this.sql`
        CREATE TABLE IF NOT EXISTS ads (
          id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
          title TEXT NOT NULL,
          description TEXT,
          image_url TEXT,
          smart_link TEXT NOT NULL,
          clicks INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;
      console.log('Table creation/check completed');

      // Check current table structure
      const tableInfo = await this.sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'ads'
        ORDER BY ordinal_position
      `;
      console.log('Table structure:', tableInfo);

      // Check if table is empty and seed if needed
      const result = await this.sql`SELECT COUNT(*) as count FROM ads`;
      const resultArray = result as unknown as Array<{ count: number }>;
      console.log('Current ad count:', resultArray[0].count);
      if (resultArray[0].count === 0) {
        console.log('Seeding database...');
        await this.seedDatabase();
        console.log('Database seeded successfully');
      }
    } catch (error) {
      console.error('Database initialization error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Database connection failed:', errorMessage);

      // Try to provide more specific error information
      if (errorMessage.includes('connect')) {
        console.error('This appears to be a connection issue. Please check:');
        console.error('1. Database URL is correct');
        console.error('2. Database is accessible from your network');
        console.error('3. Neon database is not paused');
      }
    }
  }

  private async seedDatabase() {
    const smartLinks = [
      "https://www.revenuecpmgate.com/njpbte69?key=d6e7d7df7fd19ec246b10531ff7b0d86",
      "https://www.revenuecpmgate.com/e784wjgv7?key=bf7971423bb402e8444535287b3e67ed",
      "https://www.revenuecpmgate.com/w7mykbjvj?key=b84f5d755a92e931f150d5e47e9e55f2",
      "https://www.revenuecpmgate.com/is9z7nkw4g?key=92b60b45a285840843a46786a57b6097",
      "https://www.revenuecpmgate.com/pfqy0a3nnr?key=5d7f45ada7020c8b023828f5a45c4700",
      "https://www.revenuecpmgate.com/dpbjpetz?key=f07d7cb9458a8533edf5bd1c491b74b5",
      "https://www.revenuecpmgate.com/rbf5x0qq?key=1e34518133d03f7ee76bb83ef08194a8",
      "https://www.revenuecpmgate.com/ic0aqv8sn?key=8ada22aa5d4bdeff0121efec842e914f"
    ];

    for (let i = 0; i < smartLinks.length; i++) {
      const link = smartLinks[i];
      await this.sql`
        INSERT INTO ads (title, description, image_url, smart_link, clicks, created_at)
        VALUES ('Ad ${i + 1}', 'Sample ad description ${i + 1}', 'https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=Ad+${i + 1}', '${link}', 0, NOW())
        RETURNING id
      `;
    }
  }

  async getAllAds(): Promise<Ad[]> {
    try {
      const result = await this.sql`SELECT * FROM ads ORDER BY created_at DESC`;
      return result as unknown as Ad[];
    } catch (error) {
      console.error('Error getting all ads:', error);
      throw error;
    }
  }

  async createAd(ad: Omit<Ad, 'id' | 'created_at' | 'clicks'>): Promise<Ad> {
    try {
      console.log('Creating ad with data:', ad);

      // Prepare the data, ensuring no null values for required fields
      const title = ad.title?.trim() || 'Untitled Ad';
      const description = ad.description?.trim() || 'No description provided';
      const image_url = ad.image_url?.trim() || 'https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=No+Image';
      const smart_link = ad.smart_link?.trim();

      if (!smart_link) {
        throw new Error('Smart link is required');
      }

      console.log('Prepared data:', { title, description, image_url, smart_link });

      // Try RETURNING approach with explicit column specification
      console.log('Inserting record with RETURNING...');

      const insertResult = await this.sql`
        INSERT INTO ads (title, description, image_url, smart_link)
        VALUES (${title}, ${description}, ${image_url}, ${smart_link})
        RETURNING id, title, description, image_url, smart_link, clicks, created_at
      `;

      console.log('Insert result:', insertResult);

      const insertArray = insertResult as unknown as Ad[];
      if (!insertArray || insertArray.length === 0) {
        throw new Error('Failed to insert ad - no result returned');
      }

      return insertArray[0];
    } catch (error) {
      console.error('Error creating ad:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error details:', {
        message: errorMessage,
        error,
        stack: error instanceof Error ? error.stack : undefined
      });

      throw new Error(`Failed to create ad: ${errorMessage}`);
    }
  }

  async updateAd(id: number, updates: Partial<Ad>): Promise<Ad> {
    try {
      console.log('Updating ad with id:', id, 'updates:', updates);
      // Build the SET clause dynamically
      const setParts: string[] = [];
      const values: any = { id }; // eslint-disable-line @typescript-eslint/no-explicit-any

      Object.keys(updates).forEach((key) => {
        if (updates[key as keyof Ad] !== undefined && updates[key as keyof Ad] !== '') {
          setParts.push(`${key} = $${key}`);
          values[key] = (updates as any)[key]; // eslint-disable-line @typescript-eslint/no-explicit-any
        }
      });

      if (setParts.length === 0) {
        throw new Error('No valid updates provided');
      }

      const setClause = setParts.join(', ');
      console.log('Generated SQL:', `UPDATE ads SET ${setClause} WHERE id = ${values.id}`);

      const result = await this.sql`
        UPDATE ads SET ${this.sql.unsafe(setClause)} WHERE id = ${values.id}
        RETURNING *
      `;

      const resultArray = result as unknown as Ad[];
      if (!resultArray || resultArray.length === 0) {
        throw new Error('Ad not found or update failed');
      }

      return resultArray[0];
    } catch (error) {
      console.error('Error updating ad:', error);
      throw error;
    }
  }

  async deleteAd(id: number): Promise<void> {
    try {
      console.log('Deleting ad with id:', id);
      await this.sql`DELETE FROM ads WHERE id = ${id}`;
    } catch (error) {
      console.error('Error deleting ad:', error);
      throw error;
    }
  }

  async incrementAdClicks(id: number): Promise<void> {
    try {
      console.log('Incrementing clicks for ad with id:', id);
      await this.sql`
        UPDATE ads
        SET clicks = clicks + 1
        WHERE id = ${id}
      `;
    } catch (error) {
      console.error('Error incrementing ad clicks:', error);
      throw error;
    }
  }

  async getAdStats(): Promise<{ totalAds: number; totalClicks: number; averageClicksPerAd: number }> {
    try {
      const result = await this.sql`
        SELECT
          COUNT(*) as total_ads,
          COALESCE(SUM(clicks), 0) as total_clicks
        FROM ads
      `;

      const resultArray = result as unknown as Array<{ total_ads: number; total_clicks: number }>;
      const totalAds = resultArray[0].total_ads;
      const totalClicks = resultArray[0].total_clicks;
      const averageClicksPerAd = totalAds > 0 ? totalClicks / totalAds : 0;

      return {
        totalAds,
        totalClicks,
        averageClicksPerAd
      };
    } catch (error) {
      console.error('Error getting ad stats:', error);
      throw error;
    }
  }

  // Test method to verify database and table are working
  async testDatabaseSetup(): Promise<void> {
    try {
      console.log('Testing database setup...');

      // Test connection
      const connectionTest = await this.sql`SELECT 1 as test`;
      console.log('✅ Connection test passed:', connectionTest);

      // Check table exists
      const tableCheck = await this.sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'ads'
        ) as table_exists
      `;
      const tableExists = (tableCheck as unknown as Array<{ table_exists: boolean }>)[0].table_exists;
      console.log('✅ Table exists:', tableExists);

      if (!tableExists) {
        console.log('❌ Table does not exist, recreating...');
        await this.forceResetDatabase();
        return;
      }

      // Test simple insert and select
      console.log('Testing basic operations...');
      const insertTest = await this.sql`
        INSERT INTO ads (title, smart_link)
        VALUES ('Test Record', 'https://test.com')
        RETURNING id, title, smart_link
      `;
      console.log('✅ Insert test passed:', insertTest);

      const selectTest = await this.sql`
        SELECT * FROM ads WHERE title = 'Test Record'
        ORDER BY created_at DESC LIMIT 1
      `;
      console.log('✅ Select test passed:', selectTest);

      // Clean up
      await this.sql`
        DELETE FROM ads WHERE title = 'Test Record'
      `;
      console.log('✅ Database test completed successfully!');

    } catch (error) {
      console.error('❌ Database test failed:', error);
      throw error;
    }
  }

  // Method to inspect current table structure
  async inspectTable(): Promise<void> {
    try {
      console.log('Inspecting table structure...');

      // Get table structure
      const tableInfo = await this.sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'ads'
        ORDER BY ordinal_position
      `;
      console.log('Table structure:', tableInfo);

      // Get constraints
      const constraints = await this.sql`
        SELECT conname, contype, conkey, confkey
        FROM pg_constraint
        WHERE conrelid = 'ads'::regclass
      `;
      console.log('Table constraints:', constraints);

      // Get indexes
      const indexes = await this.sql`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'ads'
      `;
      console.log('Table indexes:', indexes);

    } catch (error) {
      console.error('Error inspecting table:', error);
      throw error;
    }
  }

  async forceResetDatabase(): Promise<void> {
    try {
      console.log('Force resetting database...');

      // Drop table if it exists
      await this.sql`DROP TABLE IF EXISTS ads CASCADE`;
      console.log('Table dropped');

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Recreate table with explicit structure
      await this.sql`
        CREATE TABLE ads (
          id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
          title TEXT NOT NULL,
          description TEXT,
          image_url TEXT,
          smart_link TEXT NOT NULL,
          clicks INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      console.log('Table recreated with explicit structure');

      // Verify table structure
      const tableInfo = await this.sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'ads'
        ORDER BY ordinal_position
      `;
      console.log('New table structure:', tableInfo);

      console.log('Database reset successfully');

    } catch (error) {
      console.error('Error force resetting database:', error);
      throw error;
    }
  }

  // Public method to test connection manually
  async testDatabaseConnection(): Promise<boolean> {
    try {
      await this.sql`SELECT 1`;
      console.log('Database connection test successful');
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const db = new DatabaseService();