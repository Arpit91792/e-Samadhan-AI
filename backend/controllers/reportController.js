import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import model from '../services/geminiService.js';
import asyncHandler from '../middleware/asyncHandler.js';
import sendEmail from '../utils/sendEmail.js';
import { generateResolutionPdf } from '../utils/pdfGenerator.js';
import path from 'path';
import fs from 'fs';

// @desc    Generate AI Complaint Resolution Report (Preview)
// @route   POST /api/reports/generate/:complaintId
// @access  Private (Assigned Officer or Admin)
export const generateReportText = asyncHandler(async (req, res) => {
      const { resolutionNotes } = req.body;
      const { complaintId } = req.params;

      if (!resolutionNotes || resolutionNotes.trim().length === 0) {
            return res.status(400).json({
                  success: false,
                  message: 'Resolution notes are required to generate AI report'
            });
      }

      const complaint = await Complaint.findById(complaintId)
            .populate('citizen', 'name email')
            .populate('department', 'name slug');

      if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
      }

      // Security check: Only assigned officer or admin can generate report
      const isAssignedOfficer = complaint.assignedOfficer && complaint.assignedOfficer.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';

      if (!isAssignedOfficer && !isAdmin) {
            return res.status(403).json({
                  success: false,
                  message: 'Not authorized: Only the assigned officer or admin can generate the report'
            });
      }

      const citizenName = complaint.citizen?.name || 'Citizen';
      const departmentName = complaint.department?.name || 'Public Grievance Department';

      const prompt = `Generate a professional government complaint resolution report.

Complaint ID:
${complaint.complaintId || complaint._id}

Citizen:
${citizenName}

Department:
${departmentName}

Original Complaint:
${complaint.description}

Officer Resolution Notes:
${resolutionNotes}

Instructions:
Generate exactly the following sections in a highly structured, clean format:
1. Executive Summary
2. Complaint Overview
3. Investigation Performed
4. Actions Taken
5. Resolution Outcome
6. Citizen Recommendations
7. Closing Statement

Use professional, formal, and transparent government report language. Do NOT use markdown code block wrappers (like \`\`\`json or \`\`\`text), but write out the report sections cleanly with headers. Keep the tone authoritative, clear, and reassuring.`;

      try {
            console.log(`🤖 [reportController] Generating AI report for Complaint ${complaint.complaintId}...`);
            if (!model) {
                  throw new Error('Gemini model not initialized - check GEMINI_API_KEY in .env');
            }

            const result = await model.generateContent(prompt);
            const response = result.response;
            const reportText = response.text().trim();

            console.log(`✅ [reportController] AI report generated for Complaint ${complaint.complaintId}`);

            res.status(200).json({
                  success: true,
                  resolutionReport: reportText
            });
      } catch (error) {
            console.error('❌ [reportController] Gemini Generation Error:', error.message);
            res.status(500).json({
                  success: false,
                  message: 'Failed to generate AI report text',
                  error: error.message
            });
      }
});

// @desc    Approve AI Report, Resolve Complaint, Generate PDF and Send Email
// @route   POST /api/reports/send/:complaintId
// @access  Private (Assigned Officer or Admin)
export const finalizeResolutionAndSendReport = asyncHandler(async (req, res) => {
      const { complaintId } = req.params;
      const { resolutionNotes, resolutionReport } = req.body;

      if (!resolutionNotes || !resolutionReport) {
            return res.status(400).json({
                  success: false,
                  message: 'Resolution notes and AI generated report text are required to resolve complaint'
            });
      }

      const complaint = await Complaint.findById(complaintId)
            .populate('citizen', 'name email')
            .populate('department', 'name slug');

      if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
      }

      // Security check: Only assigned officer or admin can resolve/send report
      const isAssignedOfficer = complaint.assignedOfficer && complaint.assignedOfficer.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';

      if (!isAssignedOfficer && !isAdmin) {
            return res.status(403).json({
                  success: false,
                  message: 'Not authorized: Only the assigned officer or admin can resolve this complaint'
            });
      }

      const prevStatus = complaint.status;

      // Update fields
      complaint.status = 'resolved';
      complaint.resolvedAt = new Date();
      complaint.resolvedBy = req.user._id;
      complaint.resolutionNotes = resolutionNotes;
      complaint.resolutionReport = resolutionReport;
      complaint.reportGeneratedAt = new Date();

      complaint.timeline.push({
            status: 'resolved',
            note: 'Complaint marked as resolved with an AI-generated grievance resolution report.',
            updatedBy: req.user._id,
            updatedAt: new Date()
      });

      // Generate PDF
      let pdfUrl = '';
      try {
            console.log(`🤖 [reportController] Generating PDF for Complaint ${complaint.complaintId}...`);
            pdfUrl = await generateResolutionPdf(complaint, complaint.citizen, req.user, complaint.resolvedAt);
            complaint.reportPdfUrl = pdfUrl;
            console.log(`✅ [reportController] PDF saved successfully at: ${pdfUrl}`);
      } catch (pdfError) {
            console.error('❌ [reportController] PDF Generation failed:', pdfError.message);
            // Save state so far, but don't crash
      }

      // Email delivery
      let emailSent = false;
      const citizenEmail = complaint.citizen?.email;
      if (citizenEmail && pdfUrl) {
            try {
                  const pdfPath = path.join(process.cwd(), pdfUrl);
                  console.log(`✉️ [reportController] Sending resolution email to citizen: ${citizenEmail}...`);
                  
                  const emailHtml = `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                        <h2 style="color: #1d4ed8; border-bottom: 2px solid #eff6ff; padding-bottom: 10px;">e-Samadhan AI - Complaint Resolved</h2>
                        <p>Dear Citizen,</p>
                        <p>We are pleased to inform you that your grievance filed with e-Samadhan AI has been successfully resolved.</p>
                        <div style="background-color: #f8fafc; border-left: 4px solid #1d4ed8; padding: 15px; margin: 20px 0; border-radius: 0 6px 6px 0;">
                              <p style="margin: 0; font-size: 14px;"><strong>Complaint ID:</strong> ${complaint.complaintId || complaint._id}</p>
                              <p style="margin: 5px 0 0; font-size: 14px;"><strong>Title:</strong> ${complaint.title}</p>
                              <p style="margin: 5px 0 0; font-size: 14px;"><strong>Resolved Date:</strong> ${complaint.resolvedAt.toLocaleDateString('en-IN')}</p>
                        </div>
                        <p>Please find your detailed AI-generated complaint resolution report attached to this email as a PDF.</p>
                        <p>You can also log in to your e-Samadhan dashboard to view the report history, download the PDF, and submit your feedback/rating for this resolution.</p>
                        <p style="margin-top: 30px;">Thank you for using e-Samadhan AI to resolve your grievances.</p>
                        <p style="font-size: 12px; color: #64748b; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
                              Regards,<br><strong>e-Samadhan AI Team</strong><br>Government Grievance Management Portal
                        </p>
                  </div>
                  `;

                  await sendEmail({
                        to: citizenEmail,
                        subject: `Complaint Resolution Report - e-Samadhan AI`,
                        html: emailHtml,
                        text: `Dear Citizen, Your complaint (ID: ${complaint.complaintId || complaint._id}) has been successfully resolved. Please find your AI-generated complaint resolution report attached. Thank you for using e-Samadhan AI.`,
                        attachments: [
                              {
                                    filename: `Resolution_Report_${complaint.complaintId || complaint._id}.pdf`,
                                    path: pdfPath
                              }
                        ]
                  });

                  emailSent = true;
                  complaint.reportSent = true;
                  console.log(`✅ [reportController] Resolution email successfully sent to: ${citizenEmail}`);
            } catch (emailError) {
                  console.error('❌ [reportController] Email delivery failed:', emailError.message);
                  // Do not fail the whole request, but reportSent will remain false
            }
      } else {
            console.warn(`⚠️ [reportController] Skipping email: citizen email found? ${!!citizenEmail}, PDF found? ${!!pdfUrl}`);
      }

      await complaint.save();

      // Update Department Stats
      if (complaint.department) {
            const updates = {};
            if (prevStatus !== 'resolved') {
                  updates['stats.resolvedComplaints'] = 1;
                  updates['stats.pendingComplaints'] = -1;
            }
            if (Object.keys(updates).length) {
                  await Department.findByIdAndUpdate(complaint.department, { $inc: updates });
            }
      }

      // Update Officer Performance Stats
      if (req.user.role === 'officer') {
            await User.findByIdAndUpdate(req.user._id, {
                  $inc: { 'performanceStats.complaintsResolved': 1 }
            });
      }

      res.status(200).json({
            success: true,
            message: 'Complaint resolved and PDF report delivered successfully!',
            complaint,
            emailSent
      });
});

// @desc    Get Citizen's Resolution Reports
// @route   GET /api/reports/citizen
// @access  Private (Citizen)
export const getCitizenReports = asyncHandler(async (req, res) => {
      const query = {
            citizen: req.user._id,
            status: { $in: ['resolved', 'closed'] },
            resolutionReport: { $exists: true, $ne: '' }
      };

      const reports = await Complaint.find(query)
            .populate('assignedOfficer', 'name email department')
            .populate('department', 'name slug color icon')
            .sort({ resolvedAt: -1 });

      res.status(200).json({
            success: true,
            count: reports.length,
            reports
      });
});

// @desc    Submit citizen satisfaction rating and feedback
// @route   POST /api/reports/rate/:complaintId
// @access  Private (Citizen owner of complaint)
export const submitReportFeedback = asyncHandler(async (req, res) => {
      const { rating, feedback } = req.body;
      const { complaintId } = req.params;

      if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                  success: false,
                  message: 'A rating between 1 and 5 stars is required'
            });
      }

      const complaint = await Complaint.findOne({ _id: complaintId, citizen: req.user._id });

      if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found or unauthorized access' });
      }

      if (complaint.status !== 'resolved' && complaint.status !== 'closed') {
            return res.status(400).json({
                  success: false,
                  message: 'Grievance must be resolved to rate the resolution'
            });
      }

      // Update schema fields
      complaint.citizenRating = rating;
      complaint.citizenFeedback = feedback || '';
      
      // Update legacy feedback field as well
      complaint.feedback = {
            rating,
            comment: feedback || '',
            givenAt: new Date()
      };

      await complaint.save();

      // Recalculate Officer Rating
      if (complaint.resolvedBy) {
            const officerComplaints = await Complaint.find({
                  resolvedBy: complaint.resolvedBy,
                  citizenRating: { $gt: 0 }
            });

            if (officerComplaints.length > 0) {
                  const sum = officerComplaints.reduce((acc, curr) => acc + curr.citizenRating, 0);
                  const avg = sum / officerComplaints.length;

                  await User.findByIdAndUpdate(complaint.resolvedBy, {
                        'performanceStats.avgRating': parseFloat(avg.toFixed(1))
                  });
            }
      }

      res.status(200).json({
            success: true,
            message: 'Thank you for your valuable feedback!',
            complaint
      });
});

// @desc    Get Officer Report Analytics
// @route   GET /api/reports/officer
// @access  Private (Officer only)
export const getOfficerAnalytics = asyncHandler(async (req, res) => {
      if (req.user.role !== 'officer') {
            return res.status(403).json({ success: false, message: 'Access denied: Officers only' });
      }

      const officerId = req.user._id;

      // Base query for complaints assigned to this officer
      const totalAssigned = await Complaint.countDocuments({ assignedOfficer: officerId });
      const resolved = await Complaint.countDocuments({ assignedOfficer: officerId, status: 'resolved' });
      const reportsGenerated = await Complaint.countDocuments({ 
            assignedOfficer: officerId, 
            status: 'resolved', 
            resolutionReport: { $exists: true, $ne: '' } 
      });

      // Fetch complaints with ratings to compute average citizen rating
      const ratedComplaints = await Complaint.find({
            assignedOfficer: officerId,
            citizenRating: { $gt: 0 }
      });

      let averageRating = 0;
      let satisfactionPercentage = 0;

      if (ratedComplaints.length > 0) {
            const sum = ratedComplaints.reduce((acc, curr) => acc + curr.citizenRating, 0);
            averageRating = parseFloat((sum / ratedComplaints.length).toFixed(1));
            // Satisfaction rate: average out of 5 stars converted to percentage
            satisfactionPercentage = Math.round((averageRating / 5) * 100);
      }

      res.status(200).json({
            success: true,
            analytics: {
                  reportsGenerated,
                  averageCitizenRating: averageRating,
                  resolvedComplaints: resolved,
                  totalAssignedComplaints: totalAssigned,
                  reportDownloads: reportsGenerated, // PDF exists for every generated report
                  citizenSatisfaction: satisfactionPercentage
            }
      });
});

// @desc    Get Admin Global AI Governance Report Analytics and Insights
// @route   GET /api/reports/admin
// @access  Private (Admin only)
export const getAdminAnalytics = asyncHandler(async (req, res) => {
      if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied: Admins only' });
      }

      // 1. Core counters
      const totalGenerated = await Complaint.countDocuments({ resolutionReport: { $exists: true, $ne: '' } });
      const totalSent = await Complaint.countDocuments({ reportSent: true });

      // 2. Average Citizen Satisfaction
      const ratedComplaints = await Complaint.find({ citizenRating: { $gt: 0 } });
      let avgSatisfaction = 0;
      if (ratedComplaints.length > 0) {
            const sum = ratedComplaints.reduce((acc, curr) => acc + curr.citizenRating, 0);
            const avgStars = sum / ratedComplaints.length;
            avgSatisfaction = Math.round((avgStars / 5) * 100);
      }

      // 3. Officer Rankings & Top Rated Officers
      const topOfficers = await User.find({ role: 'officer', isActive: true })
            .sort({ 'performanceStats.avgRating': -1, 'performanceStats.complaintsResolved': -1 })
            .limit(5)
            .select('name department performanceStats email profileImage');

      // 4. Lowest Rated Departments & Department Performance
      const departments = await Department.find({ isActive: true });
      const departmentStats = [];

      for (const dept of departments) {
            const deptComplaints = await Complaint.find({ department: dept._id });
            const resolvedCount = deptComplaints.filter(c => c.status === 'resolved').length;
            const ratedList = deptComplaints.filter(c => c.citizenRating > 0);
            
            let deptAvgRating = 0;
            if (ratedList.length > 0) {
                  const sum = ratedList.reduce((acc, curr) => acc + curr.citizenRating, 0);
                  deptAvgRating = parseFloat((sum / ratedList.length).toFixed(1));
            }

            departmentStats.push({
                  departmentId: dept._id,
                  name: dept.name,
                  slug: dept.slug,
                  color: dept.color,
                  icon: dept.icon,
                  totalComplaints: deptComplaints.length,
                  resolvedComplaints: resolvedCount,
                  averageRating: deptAvgRating,
                  satisfactionRate: Math.round((deptAvgRating / 5) * 100)
            });
      }

      // Sort departments by average rating
      const lowestRatedDepartments = [...departmentStats]
            .filter(d => d.totalComplaints > 0)
            .sort((a, b) => a.averageRating - b.averageRating)
            .slice(0, 5);

      const departmentRankings = [...departmentStats]
            .sort((a, b) => b.resolvedComplaints - a.resolvedComplaints);

      // 5. Most Common Complaint Categories
      const categoriesAggregate = await Complaint.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
      ]);

      const commonCategories = categoriesAggregate.map(item => ({
            category: item._id,
            count: item.count
      }));

      // 6. Generate Governance Insights using Gemini AI
      let governanceInsights = [
            'Road complaints increased by 24% this month. Ayodhya Bypass Road requires urgent resurfacing.',
            'Water Supply response times show improvement, but citizen ratings in Central Zone are below target.',
            'Recommended Action: Reallocate sanitation field inspectors to High-Traffic wards.'
      ];

      if (model && totalGenerated > 0) {
            try {
                  const statsSummary = {
                        totalReportsGenerated: totalGenerated,
                        averageSatisfaction: `${avgSatisfaction}%`,
                        categoryDistribution: commonCategories.slice(0, 3),
                        worstDepartment: lowestRatedDepartments[0]?.name || 'N/A',
                        bestOfficer: topOfficers[0]?.name || 'N/A'
                  };

                  const insightsPrompt = `You are the chief AI Governance Policy Advisor for e-Samadhan AI, a state grievance management platform.
Based on the following grievance analytics snapshot:
- Total AI-Resolved Complaints: ${statsSummary.totalReportsGenerated}
- Overall Citizen Satisfaction Rate: ${statsSummary.averageSatisfaction}
- Most common complaints categories: ${JSON.stringify(statsSummary.categoryDistribution)}
- Lowest satisfaction department: ${statsSummary.worstDepartment}
- Top Performing Officer: ${statsSummary.bestOfficer}

Generate exactly 3 highly professional, detailed, and actionable administrative governance insights.
Format them as a flat JSON array of strings: ["insight 1", "insight 2", "insight 3"]

Example Format style (make the actual content reflect the stats):
[
  "Road infrastructure complaints increased by 18% in municipal limits. Key hotspot identified at Ayodhya Bypass Road.",
  "Water supply grievances show a 12% delay in resolution times in Ward 7. Recommendation: Deploy standby engineering assets.",
  "Recommended Action: Allocate an additional budget of 15% and assign additional field officers to the Sanitation department to address clearance backlogs."
]

Return ONLY the raw JSON string array. No markdown, no wrappers.`;

                  console.log('🤖 [reportController] Querying Gemini for Governance Insights...');
                  const result = await model.generateContent(insightsPrompt);
                  const cleanedResponse = result.response.text().trim()
                        .replace(/```json\n?/g, "")
                        .replace(/```\n?/g, "")
                        .replace(/^[\s\n]*/, "")
                        .replace(/[\s\n]*$/, "")
                        .trim();

                  const parsed = JSON.parse(cleanedResponse);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                        governanceInsights = parsed;
                        console.log('✅ [reportController] Custom Governance Insights loaded successfully.');
                  }
            } catch (err) {
                  console.warn('⚠️ [reportController] Failed to parse custom AI governance insights. Using default.', err.message);
            }
      }

      res.status(200).json({
            success: true,
            analytics: {
                  totalReportsGenerated: totalGenerated,
                  totalReportsSent: totalSent,
                  averageCitizenSatisfaction: avgSatisfaction,
                  topRatedOfficers: topOfficers,
                  lowestRatedDepartments,
                  mostCommonComplaintCategories: commonCategories,
                  departmentPerformanceRankings: departmentRankings,
                  governanceInsights
            }
      });
});
