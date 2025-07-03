// scripts/seedCategories.js
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const Category = require('../models/Category');

dotenv.config();
connectDB();

const categories = [
  { name: 'Frontend' },
  { name: 'Backend' },
  { name: 'Fullstack' },
  { name: 'DevOps' },
  { name: 'Cybersecurity' },
  { name: 'Data Analyst' },
  { name: 'Data Scientist' },
  { name: 'Mobile Developer' },
  { name: 'Game Developer' },
  { name: 'AI / ML Engineer' },
  { name: 'UI/UX Designer' },
  { name: 'System Administrator' },
  { name: 'Database Administrator (DBA)' },
  { name: 'Cloud Engineer' },
  { name: 'Software Tester / QA' }
];

const seedCategories = async () => {
  try {
    console.log('Kateqoriyalar silinir...');
    await Category.deleteMany(); 

    console.log('Yeni kateqoriyalar əlavə edilir...');
    await Category.insertMany(categories);
    console.log('Kateqoriyalar uğurla əlavə edildi!');
    process.exit();
  } catch (error) {
    console.error('Kateqoriyaları əlavə edərkən xəta:', error);
    process.exit(1);
  }
};

seedCategories();