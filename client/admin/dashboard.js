document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    window.location.href = '/admin/';
    return;
  }

  // Common Headers for API requests
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // State
  let currentAppId = null;
  let currentFilter = 'all';

  // --- View Switching ---
  const navLinks = document.querySelectorAll('.nav-links li');
  const dashboardView = document.getElementById('dashboardView');
  const applicationsView = document.getElementById('applicationsView');
  const reviewsView = document.getElementById('reviewsView');

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      const view = link.getAttribute('data-view');
      
      dashboardView.style.display = 'none';
      applicationsView.style.display = 'none';
      reviewsView.style.display = 'none';

      if(view === 'dashboard') dashboardView.style.display = 'block';
      else if (view === 'applications') applicationsView.style.display = 'block';
      else if (view === 'reviews') {
        reviewsView.style.display = 'block';
        fetchReviews();
      }
    });
  });

  document.getElementById('globalDateFilter').addEventListener('change', (e) => {
    currentFilter = e.target.value;
    loadDashboardData();
  });

  // Init
  loadDashboardData();
  fetchApplications();

  function loadDashboardData() {
    fetchOverview();
    fetchCharts();
    fetchActivity();
  }

  // --- Counter Animation ---
  function animateCounter(id, target) {
    const el = document.getElementById(id);
    if(!el) return;
    const start = 0;
    const duration = 1000;
    const increment = target / (duration / 16);
    let current = start;

    const updateCounter = () => {
      current += increment;
      if (current < target) {
        el.innerText = id === 'statRevenue' ? `₹${Math.ceil(current).toLocaleString()}` : Math.ceil(current);
        requestAnimationFrame(updateCounter);
      } else {
        el.innerText = id === 'statRevenue' ? `₹${target.toLocaleString()}` : target;
      }
    };
    updateCounter();
  }

  // --- API Calls ---

  async function fetchOverview() {
    try {
      const res = await fetch(`/api/admin/analytics/overview?filter=${currentFilter}`, { headers });
      const data = await res.json();
      if (data.success) {
        animateCounter('statTotal', data.stats.totalApplications);
        animateCounter('statRevenue', data.stats.totalRevenue);
        animateCounter('statToday', data.stats.applicationsToday);
        animateCounter('statThisMonth', data.stats.applicationsThisMonth);
        animateCounter('statPending', data.stats.pending);
        animateCounter('statSelected', data.stats.selected);
        animateCounter('statRejected', data.stats.rejected);
        animateCounter('statActiveBatches', data.stats.activeBatches);
        animateCounter('statTotalReviews', data.stats.totalReviews || 0);
        animateCounter('statPendingReviews', data.stats.pendingReviews || 0);
        
        const reviewEl = document.getElementById('statAvgRating');
        if(reviewEl) reviewEl.innerText = data.stats.avgReviewRating || '0.0';
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchCharts() {
    try {
      const res = await fetch(`/api/admin/analytics/charts?filter=${currentFilter}`, { headers });
      const data = await res.json();
      if (data.success) {
        renderTrendChart(data.charts.applicationTrend);
        renderRevenueChart(data.charts.revenueTrend);
        renderStatusChart(data.charts.statusStats);
        renderDomainChart(data.charts.domainStats);
        if (data.charts.reviewDistribution) {
          renderReviewChart(data.charts.reviewDistribution);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchActivity() {
    try {
      const res = await fetch(`/api/admin/analytics/activity?limit=10`, { headers });
      const data = await res.json();
      if (data.success) {
        const container = document.getElementById('activityContainer');
        container.innerHTML = '';
        if(data.activity.length === 0) {
          container.innerHTML = '<p style="color: var(--text-secondary)">No recent activity.</p>';
        }
        data.activity.forEach(act => {
          let iconClass = '';
          let iconChar = 'ℹ️';
          if(act.type === 'new_application') { iconClass = ''; iconChar = '📝'; }
          if(act.type === 'payment') { iconClass = 'payment'; iconChar = '💰'; }
          if(act.type === 'status_update') { iconClass = 'status'; iconChar = '🔄'; }

          const time = new Date(act.timestamp).toLocaleString();
          container.innerHTML += `
            <div class="feed-item">
              <div class="feed-icon ${iconClass}">${iconChar}</div>
              <div class="feed-details">
                <p>${act.description}</p>
                <div class="feed-time">${time}</div>
              </div>
            </div>
          `;
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchApplications(search = '', status = '', batch = '') {
    try {
      let url = `/api/admin/applications?limit=50`;
      if (search) url += `&search=${search}`;
      if (status) url += `&status=${status}`;
      if (batch) url += `&internshipBatch=${batch}`;

      const res = await fetch(url, { headers });
      const data = await res.json();
      
      if (data.success) {
        renderTable(data.applications);
      } else if (res.status === 401) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/';
      }
    } catch (e) {
      console.error(e);
    }
  }

  // --- Reviews API Calls ---
  async function fetchReviews() {
    try {
      const res = await fetch(`/api/admin/reviews`, { headers });
      const data = await res.json();
      if (data.success) {
        let reviews = data.data;
        const statusFilter = document.getElementById('reviewStatusFilter').value;
        if (statusFilter) {
          reviews = reviews.filter(r => r.status === statusFilter);
        }
        renderReviewsTable(reviews);
      }
    } catch (e) { console.error(e); }
  }

  document.getElementById('reviewStatusFilter').addEventListener('change', fetchReviews);

  async function updateReviewStatus(id, action) {
    try {
      const res = await fetch(`/api/admin/reviews/${id}/${action}`, { method: 'PUT', headers });
      const data = await res.json();
      if (data.success) {
        showToast(`Review ${action}d successfully`);
        fetchReviews();
        fetchOverview();
      } else {
        showToast(data.message, 'error');
      }
    } catch (e) { console.error(e); }
  }

  async function deleteReview(id) {
    if(!confirm("Are you sure you want to delete this review?")) return;
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        showToast("Review deleted");
        fetchReviews();
        fetchOverview();
      }
    } catch (e) { console.error(e); }
  }

  function renderReviewsTable(reviews) {
    const tbody = document.getElementById('reviewsTableBody');
    tbody.innerHTML = '';
    
    reviews.forEach(review => {
      const tr = document.createElement('tr');
      const date = new Date(review.createdAt).toLocaleDateString();
      let statusBadge = review.status === 'Approved' ? 'selected' : (review.status === 'Rejected' ? 'rejected' : 'pending');
      
      tr.innerHTML = `
        <td>${date}</td>
        <td>${review.fullName}<br><small>${review.email}</small></td>
        <td>${review.rating} ⭐</td>
        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${review.review}</td>
        <td><span class="badge ${statusBadge}">${review.status}</span></td>
        <td>
          ${review.status === 'Pending' ? `
            <button class="btn primary-btn approve-review-btn" data-id="${review._id}" style="padding: 5px 10px; font-size: 12px;">Approve</button>
            <button class="btn danger-btn reject-review-btn" data-id="${review._id}" style="padding: 5px 10px; font-size: 12px; margin-left: 5px;">Reject</button>
          ` : ''}
          <button class="btn danger-btn del-review-btn" data-id="${review._id}" style="padding: 5px 10px; font-size: 12px; margin-left: 5px;">Del</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll('.approve-review-btn').forEach(btn => btn.onclick = (e) => updateReviewStatus(e.target.dataset.id, 'approve'));
    document.querySelectorAll('.reject-review-btn').forEach(btn => btn.onclick = (e) => updateReviewStatus(e.target.dataset.id, 'reject'));
    document.querySelectorAll('.del-review-btn').forEach(btn => btn.onclick = (e) => deleteReview(e.target.dataset.id));
  }

  // --- Rendering ---

  function renderTable(apps) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    apps.forEach(app => {
      const tr = document.createElement('tr');
      const date = new Date(app.createdAt).toLocaleDateString();
      
      let badgeClass = 'pending';
      if (app.status === 'Selected') badgeClass = 'selected';
      if (app.status === 'Rejected') badgeClass = 'rejected';
      if (app.status === 'Under Review' || app.status === 'Shortlisted' || app.status === 'Interview Scheduled') badgeClass = 'review';

      const statuses = ['Pending', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected'];
      let optionsHtml = statuses.map(s => `<option value="${s}" ${app.status === s ? 'selected' : ''}>${s}</option>`).join('');

      tr.innerHTML = `
        <td>${date}</td>
        <td>${app.fullName}<br><small>${app.email}</small></td>
        <td>${app.domain}</td>
        <td>
          <select class="inline-select status-change" data-id="${app._id}">
            ${optionsHtml}
          </select>
        </td>
        <td>
          <button class="btn primary-btn view-btn" data-id="${app._id}" style="padding: 5px 10px; font-size: 12px;">View</button>
          <button class="btn view-history-btn" data-id="${app._id}" style="padding: 5px 10px; font-size: 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; margin-left: 5px;">History</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Add event listeners to new buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        openModal(e.target.getAttribute('data-id'));
      });
    });

    document.querySelectorAll('.view-history-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        openHistoryModal(e.target.getAttribute('data-id'));
      });
    });

    document.querySelectorAll('.status-change').forEach(select => {
      select.addEventListener('change', async (e) => {
        const newStatus = e.target.value;
        const id = e.target.getAttribute('data-id');
        await updateStatusApi(id, newStatus);
      });
    });
  }

  // --- API Helpers ---
  async function updateStatusApi(id, status, remarks = '') {
    try {
      const res = await fetch(`/api/admin/application/${id}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status, remarks })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Status updated successfully!', 'success');
        fetchApplications(searchInput.value, statusFilter.value, document.getElementById('batchFilter').value);
        fetchOverview();
      } else {
        showToast(data.message || 'Error updating status', 'error');
      }
    } catch (e) { 
      console.error(e); 
      showToast('Server error updating status', 'error');
    }
  }

  function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  let trendChartInstance = null;
  function renderTrendChart(trendData) {
    const ctx = document.getElementById('trendChart').getContext('2d');
    if (trendChartInstance) trendChartInstance.destroy();
    
    const labels = trendData.map(d => d._id);
    const data = trendData.map(d => d.count);

    trendChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Applications',
          data,
          borderColor: '#6c63ff',
          backgroundColor: 'rgba(108, 99, 255, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8b949e' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8b949e', stepSize: 1 } }
        }
      }
    });
  }

  let revenueChartInstance = null;
  function renderRevenueChart(revenueData) {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    if (revenueChartInstance) revenueChartInstance.destroy();
    
    const labels = revenueData.map(d => d._id);
    const data = revenueData.map(d => d.revenue);

    revenueChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Revenue (₹)',
          data,
          borderColor: '#2ea043',
          backgroundColor: 'rgba(46, 160, 67, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8b949e' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8b949e' } }
        }
      }
    });
  }

  let statusChartInstance = null;
  function renderStatusChart(statusStats) {
    const ctx = document.getElementById('statusChart').getContext('2d');
    if (statusChartInstance) statusChartInstance.destroy();
    
    const labels = statusStats.map(d => d._id);
    const data = statusStats.map(d => d.count);

    statusChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: ['#d29922', '#58a6ff', '#8957e5', '#f85149', '#2ea043', '#8b949e']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'right', labels: { color: '#c9d1d9' } } },
        cutout: '70%'
      }
    });
  }

  let domainChartInstance = null;
  function renderDomainChart(domainStats) {
    const ctx = document.getElementById('domainChart').getContext('2d');
    if (domainChartInstance) domainChartInstance.destroy();
    
    const labels = domainStats.map(d => d._id);
    const data = domainStats.map(d => d.count);

    domainChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Applications',
          data,
          backgroundColor: 'rgba(108, 99, 255, 0.8)',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#8b949e' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8b949e', stepSize: 1 } }
        }
      }
    });
  }

  let reviewChartInstance = null;
  function renderReviewChart(reviewStats) {
    const ctx = document.getElementById('reviewChart').getContext('2d');
    if (reviewChartInstance) reviewChartInstance.destroy();
    
    // Default to 1-5 stars if no data
    const completeStats = [1, 2, 3, 4, 5].map(star => {
      const match = reviewStats.find(r => r._id === star);
      return { star: \`\${star} ⭐\`, count: match ? match.count : 0 };
    });

    reviewChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: completeStats.map(s => s.star),
        datasets: [{
          label: 'Reviews',
          data: completeStats.map(s => s.count),
          backgroundColor: '#ffcc00',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#8b949e' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8b949e', stepSize: 1 } }
        }
      }
    });
  }

  // --- Modal Logic ---

  const modal = document.getElementById('appModal');
  const closeBtn = document.querySelector('.close');

  closeBtn.onclick = () => modal.style.display = "none";
  window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; }

  async function openModal(id) {
    currentAppId = id;
    try {
      const res = await fetch(`/api/admin/application/${id}`, { headers });
      const data = await res.json();
      
      if (data.success) {
        const app = data.application;
        document.getElementById('modalName').innerText = app.fullName;
        document.getElementById('modalStatusBadge').innerText = app.status;
        document.getElementById('modalEmail').innerText = app.email;
        document.getElementById('modalPhone').innerText = app.phone;
        document.getElementById('modalCollege').innerText = app.college;
        document.getElementById('modalCourse').innerText = `${app.course} (Year ${app.year})`;
        document.getElementById('modalDomain').innerText = app.domain;
        document.getElementById('modalPayment').innerText = app.paymentId || 'N/A';
        
        // Setup Resume links (Cloudinary supports appending fl_attachment to download)
        const resumeUrl = app.resume && app.resume.url ? app.resume.url : (app.resumeLink || '#');
        const downloadUrl = resumeUrl !== '#' ? resumeUrl.replace('/upload/', '/upload/fl_attachment/') : '#';
        
        document.getElementById('modalResume').href = resumeUrl;
        
        const downloadBtn = document.getElementById('modalResumeDownload');
        if(downloadBtn) downloadBtn.href = downloadUrl;
        
        document.getElementById('modalWhy').innerText = app.whyJoin;
        
        document.getElementById('updateStatusSelect').value = app.status;

        modal.style.display = "block";
      }
    } catch (e) {
      console.error(e);
    }
  }

  // --- History Modal Logic ---
  const historyModal = document.getElementById('historyModal');
  const closeHistoryBtn = document.getElementById('closeHistoryModal');

  if (closeHistoryBtn) {
    closeHistoryBtn.onclick = () => historyModal.style.display = "none";
  }
  
  // Combine modal dismissal window listener helper
  window.addEventListener('click', (e) => {
    if (e.target == historyModal) historyModal.style.display = "none";
  });

  async function openHistoryModal(id) {
    try {
      const res = await fetch(`/api/admin/application/${id}/history`, { headers });
      const data = await res.json();
      
      if (data.success) {
        const timeline = document.getElementById('historyTimeline');
        timeline.innerHTML = '';
        
        if (data.history && data.history.length > 0) {
          data.history.forEach(item => {
            const timeItem = document.createElement('div');
            timeItem.className = 'timeline-item';
            timeItem.innerHTML = `
              <div class="timeline-date">${new Date(item.createdAt).toLocaleString()}</div>
              <div class="timeline-content">
                <p><strong>Status:</strong> <span class="badge ${item.status.toLowerCase().replace(/\\s+/g, '-')}">${item.status}</span></p>
                <p>${item.remarks || 'No remarks.'}</p>
                <p style="font-size: 11px; color: var(--text-muted); margin-top: 5px;">By: ${item.updatedBy || 'System'}</p>
              </div>
            `;
            timeline.appendChild(timeItem);
          });
        } else {
          timeline.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No history records found.</p>';
        }
        
        historyModal.style.display = "block";
      } else {
        showToast(data.message || 'Failed to load status history', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Error loading history timeline', 'error');
    }
  }

  // --- Actions ---

  document.getElementById('updateStatusBtn').addEventListener('click', async () => {
    const status = document.getElementById('updateStatusSelect').value;
    await updateStatusApi(currentAppId, status);
    modal.style.display = "none";
  });

  document.getElementById('deleteAppBtn').addEventListener('click', async () => {
    if(!confirm('Are you sure you want to delete this application?')) return;
    try {
      const res = await fetch(`/api/admin/application/${currentAppId}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        modal.style.display = "none";
        fetchApplications();
        fetchOverview();
      }
    } catch (e) { console.error(e); }
  });

  // --- Search & Filter ---
  
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  const batchFilter = document.getElementById('batchFilter');

  searchInput.addEventListener('input', debounce(() => {
    fetchApplications(searchInput.value, statusFilter.value, batchFilter.value);
  }, 500));

  statusFilter.addEventListener('change', () => {
    fetchApplications(searchInput.value, statusFilter.value, batchFilter.value);
  });

  batchFilter.addEventListener('change', () => {
    fetchApplications(searchInput.value, statusFilter.value, batchFilter.value);
  });

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => { clearTimeout(timeout); func(...args); };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // --- Exports ---
  
  document.getElementById('exportPdfBtn').addEventListener('click', () => {
    // Basic wrapper to show this is wired up; you'd typically use jsPDF here for a real PDF
    window.print();
  });

  document.getElementById('exportCsvBtn').addEventListener('click', () => {
    window.open(`/api/admin/export/csv?token=${token}`, '_blank');
  });

  const exportExcelBtn = document.getElementById('exportExcelBtn');
  if (exportExcelBtn) {
    exportExcelBtn.addEventListener('click', () => {
      window.open(`/api/admin/export/excel?token=${token}`, '_blank');
    });
  }

  // --- Logout ---
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/';
  });

});
