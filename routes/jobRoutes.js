const express = require('express');
const {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  applyJob,
  getCompanyJobs,
  getJobApplicants
} = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

// Filter route (query parametrlərlə işləyir)
router.get('/filter', getJobs);

router.route('/')
  .get(getJobs)
  .post(protect, authorize(['company']), createJob);

router.route('/:id')
  .get(getJob)
  .put(protect, authorize(['company']), updateJob)
  .delete(protect, authorize(['company']), deleteJob);

router.route('/:id/apply')
  .post(protect, authorize(['applicant']), applyJob);

router.route('/company/myjobs')
  .get(protect, authorize(['company']), getCompanyJobs);

router.route('/:id/applicants')
  .get(protect, authorize(['company']), getJobApplicants);

module.exports = router;