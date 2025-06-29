const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');
const cors = require('cors');

// Route fayllarını import et
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const applicantRoutes = require('./routes/applicantRoutes');
const companyRoutes = require('./routes/companyRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const jobRoutes = require('./routes/jobRoutes');

// .env faylını yüklə
dotenv.config();

// MongoDB-yə qoşul
connectDB();

const app = express();

// JSON body parse etmək üçün middleware
app.use(express.json());

// app.use(cors({
//   origin: 'https://az-portaljob.vercel.app',
// }));

app.use(cors())

// Public folder for static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Auth yollarını istifadə et
app.use('/api/auth', authRoutes);

// İstifadəçi profili yollarını istifadə et
app.use('/api/users', userRoutes);

// Admin yollarını istifadə et
app.use('/api/admin', adminRoutes);

app.use('/api/applicants', applicantRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/jobs', jobRoutes);

// Serverin işlədiyini yoxlamaq üçün əsas yol
app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});