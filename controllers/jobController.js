const Job = require('../models/Job');
const Category = require('./../models/Category'); // Yolunuzu yoxlayın
const Company = require('./../models/Company'); // Yolunuzu yoxlayın
const User = require('./../models/User'); // Yolunuzu yoxlayın
const ApplicantProfile = require('./../models/ApplicantProfile'); // Yolunuzu yoxlayın
const asyncHandler = require('./../middleware/async'); // Yolunuzu yoxlayın

exports.getJobs = asyncHandler(async (req, res) => {
  let filter = {}; // Boş filter obyekti

  const { 
    category, 
    location, 
    salaryRange, 
    jobType, 
    experienceLevel, 
    companyName, 
    title 
  } = req.query;

  // Kateqoriya üzrə filter
  if (category) {
    const categoryDoc = await Category.findOne({ name: { $regex: category, $options: 'i' } });
    if (categoryDoc) {
      filter.category = categoryDoc._id;
    } else {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }
  }

  if (location) {
    filter.location = { $regex: location, $options: 'i' };
  }

  if (salaryRange) {
    filter.salaryRange = salaryRange;
  }

  if (jobType) {
    filter.jobType = jobType;
  }

  if (experienceLevel) {
    filter.experienceLevel = experienceLevel;
  }

  if (companyName) {
    const companies = await Company.find({ companyName: { $regex: companyName, $options: 'i' } });
    if (companies.length > 0) {
      filter.company = { $in: companies.map(comp => comp._id) };
    } else {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }
  }

  if (title) {
    filter.title = { $regex: title, $options: 'i' };
  }

  const jobs = await Job.find(filter)
    .populate('company', 'companyName industry logoUrl') 
    .populate('category', 'name')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: jobs.length,
    data: jobs
  });
});

exports.getJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id)
    .populate('company', 'companyName description address website phone logoUrl establishedYear')
    .populate('category', 'name');

  if (!job) {
    return res.status(404).json({ message: `ID-si ${req.params.id} olan iş elanı tapılmadı.` });
  }

  res.status(200).json({
    success: true,
    data: job
  });
});

exports.createJob = asyncHandler(async (req, res) => {
  const company = await Company.findOne({ userId: req.user.id });

  if (!company) {
    return res.status(404).json({ message: 'Şirkət profiliniz tapılmadı. Zəhmət olmasa profilinizi tamamlayın.' });
  }

  const category = await Category.findById(req.body.category);
  if (!category) {
    return res.status(400).json({ message: 'Göndərilən kateqoriya mövcud deyil.' });
  }

  req.body.company = company._id;

  const job = await Job.create(req.body);

  res.status(201).json({
    success: true,
    data: job
  });
});

// İş elanını yenilə
exports.updateJob = asyncHandler(async (req, res) => {
  let job = await Job.findById(req.params.id);

  if (!job) {
    return res.status(404).json({ message: `ID-si ${req.params.id} olan iş elanı tapılmadı.` });
  }

  const company = await Company.findOne({ userId: req.user.id });

  // Hər iki id-ni stringə çevir və müqayisə et
  const jobCompanyId = (job.company && job.company._id)
    ? job.company._id.toString()
    : job.company
      ? job.company.toString()
      : null;

  if (!company || !jobCompanyId || jobCompanyId !== company._id.toString()) {
    return res.status(401).json({ message: 'Bu iş elanını yeniləmək icazəniz yoxdur.' });
  }

  if (req.body.category) {
    const newCategory = await Category.findById(req.body.category);
    if (!newCategory) {
      return res.status(400).json({ message: 'Göndərilən yeni kateqoriya mövcud deyil.' });
    }
  }

  job = await Job.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: job
  });
});

// İş elanını sil
exports.deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    return res.status(404).json({ message: `ID-si ${req.params.id} olan iş elanı tapılmadı.` });
  }

  const company = await Company.findOne({ userId: req.user.id });

  if (!company || job.company.toString() !== company._id.toString()) {
    return res.status(401).json({ message: 'Bu iş elanını silmək icazəniz yoxdur.' });
  }

  await job.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});


exports.applyJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    return res.status(404).json({ message: `ID-si ${req.params.id} olan iş elanı tapılmadı.` });
  }

  if (req.user.role !== 'applicant') {
    return res.status(403).json({ message: 'Yalnız iş axtaranlar işə müraciət edə bilərlər.' });
  }

  // İstifadəçinin daha əvvəl müraciət edib-etmədiyini yoxla
  const alreadyApplied = job.applicants.some(
    (applicant) => applicant.user.toString() === req.user.id
  );

  if (alreadyApplied) {
    return res.status(400).json({ message: 'Bu iş elanına artıq müraciət etmisiniz.' });
  }

  // İş axtaranın CV yolunu ApplicantProfile-dan götürün
  const applicantProfile = await ApplicantProfile.findOne({ userId: req.user.id });

  if (!applicantProfile || !applicantProfile.resume) {
    return res.status(400).json({ message: 'Müraciət etmək üçün zəhmət olmasa CV-nizi profilinizə yükləyin.' });
  }

  job.applicants.push({ user: req.user.id, resume: applicantProfile.resume });
  await job.save();

  res.status(200).json({
    success: true,
    message: 'Müraciətiniz uğurla qeydə alındı!',
  });
});


exports.getCompanyJobs = asyncHandler(async (req, res) => {
  const company = await Company.findOne({ userId: req.user.id });

  if (!company) {
    return res.status(404).json({ message: 'Şirkət profiliniz tapılmadı.' });
  }

  const jobs = await Job.find({ company: company._id })
    .populate('category', 'name')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: jobs.length,
    data: jobs
  });
});


// @access  Private (yalnız iş elanını yaradan şirkət)
exports.getJobApplicants = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    return res.status(404).json({ message: `ID-si ${req.params.id} olan iş elanı tapılmadı.` });
  }

  const company = await Company.findOne({ userId: req.user.id });

  // DÜZƏLİŞ: company id müqayisəsi
  const jobCompanyId = job.company._id ? job.company._id.toString() : job.company.toString();
  if (!company || jobCompanyId !== company._id.toString()) {
    return res.status(401).json({ message: 'Bu iş elanına gələn müraciətlərə baxmaq icazəniz yoxdur.' });
  }

  const applicantsWithDetails = await Job.findById(req.params.id)
    .select('applicants')
    .populate({
      path: 'applicants.user',
      select: 'email role',
      populate: {
        path: 'applicantProfile',
        model: 'ApplicantProfile',
        select: 'firstName lastName category yearsOfExperience phone about education experience skills resume profilePicture', 
        populate: {
          path: 'category',
          model: 'Category',
          select: 'name'
        }
      }
    });

  const filteredApplicants = applicantsWithDetails.applicants
    .filter(app => app.user && app.user.role === 'applicant' && app.user.applicantProfile)
    .map(app => ({
      _id: app.user._id,
      email: app.user.email,
      role: app.user.role,
      firstName: app.user.applicantProfile.firstName,
      lastName: app.user.applicantProfile.lastName,
      category: app.user.applicantProfile.category?.name,
      yearsOfExperience: app.user.applicantProfile.yearsOfExperience,
      phone: app.user.applicantProfile.phone,
      about: app.user.applicantProfile.about,
      education: app.user.applicantProfile.education,
      experience: app.user.applicantProfile.experience,
      skills: app.user.applicantProfile.skills,
      resume: app.user.applicantProfile.resume,
      profilePicture: app.user.applicantProfile.profilePicture, 
      appliedAt: app.appliedAt,
    }));

  res.status(200).json({
    success: true,
    count: filteredApplicants.length,
    data: filteredApplicants
  });
});
