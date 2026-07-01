require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./server/app');

const { MongoMemoryServer } = require('mongodb-memory-server');

const PORT = process.env.PORT || 3000;

const Review = require('./server/models/Review');

async function seedInitialReviews() {
  try {
    const count = await Review.countDocuments();
    if (count === 0) {
      console.log('Seeding initial approved reviews...');
      const seedData = [
        {
          fullName: 'Aarav Mehta',
          email: 'aarav.mehta@example.com',
          domain: 'Frontend Development',
          rating: 5,
          review: 'The Frontend internship cohort was exceptional. The mentor support was immediate, and building actual code templates really bridged my theoretical college courses with reality.',
          status: 'Approved'
        },
        {
          fullName: 'Ananya Iyer',
          email: 'ananya.iyer@example.com',
          domain: 'Full Stack Development',
          rating: 5,
          review: 'NextGenZ Tech was a game-changer for me. I worked remote, learned modern frameworks (Node/React), and won the performance stipend for my cohort.',
          status: 'Approved'
        },
        {
          fullName: 'Rohan Sharma',
          email: 'rohan.sharma@example.com',
          domain: 'Data Science',
          rating: 5,
          review: 'The curriculum was structured beautifully. I learned statistics, database querying, data cleanup, and created actual predictive models that I showcased on my resume.',
          status: 'Approved'
        }
      ];
      await Review.insertMany(seedData);
      console.log('Seeding complete. Seeded 3 approved reviews.');
    }
  } catch (error) {
    console.error('Error seeding initial reviews:', error);
  }
}

// Connect to MongoDB
async function startServer() {
  try {
    console.log('Attempting to connect to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB Atlas');
  } catch (err) {
    console.warn('Atlas connection failed (likely IP whitelist issue). Falling back to in-memory MongoDB...');
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('Connected to In-Memory MongoDB');
  }

  // Seed reviews if database is empty
  await seedInitialReviews();

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

startServer();
