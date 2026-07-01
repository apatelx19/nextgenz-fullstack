// Navbar Scroll Effect
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

const domainCards = document.querySelectorAll(".domain-card");
const selectedDomain = document.getElementById("selectedDomain");
const form = document.getElementById("applicationForm");
const submitButton = document.getElementById("submit-button");
const buttonText = document.getElementById("button-text");

// File Upload Elements
const fileUploadContainer = document.getElementById('fileUploadContainer');
const resumeFileInput = document.getElementById('resumeFile');
const uploadArea = document.getElementById('uploadArea');
const filePreview = document.getElementById('filePreview');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const removeFileBtn = document.getElementById('removeFileBtn');
const uploadProgressContainer = document.getElementById('uploadProgressContainer');
const uploadProgressBar = document.getElementById('uploadProgressBar');

let selectedFile = null;

// Domain Selection
domainCards.forEach(card => {
  card.addEventListener("click", () => {
    const domain = card.dataset.domain;
    selectedDomain.value = domain;

    domainCards.forEach(c => c.classList.remove("active-domain"));
    card.classList.add("active-domain");
    document.getElementById("apply").scrollIntoView({ behavior: "smooth" });
  });
});

// Plan Selection
const planCards = document.querySelectorAll(".plan-card");
const selectedPlan = document.getElementById("selectedPlan");

planCards.forEach(card => {
  card.addEventListener("click", () => {
    const plan = card.dataset.plan;
    selectedPlan.value = plan;

    planCards.forEach(c => c.classList.remove("active-plan"));
    card.classList.add("active-plan");
  });
});

// File Upload Logic
uploadArea.addEventListener('click', () => resumeFileInput.click());

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  fileUploadContainer.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
  fileUploadContainer.addEventListener(eventName, () => {
    fileUploadContainer.classList.add('dragover');
  }, false);
});

['dragleave', 'drop'].forEach(eventName => {
  fileUploadContainer.addEventListener(eventName, () => {
    fileUploadContainer.classList.remove('dragover');
  }, false);
});

fileUploadContainer.addEventListener('drop', (e) => {
  const dt = e.dataTransfer;
  const files = dt.files;
  handleFiles(files);
});

resumeFileInput.addEventListener('change', function() {
  handleFiles(this.files);
});

function handleFiles(files) {
  if (files.length === 0) return;
  const file = files[0];

  if (file.type !== 'application/pdf') {
    alert("❌ Only PDF files are allowed.");
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    alert("❌ Maximum file size is 5MB.");
    return;
  }

  selectedFile = file;
  
  // Update UI
  uploadArea.style.display = 'none';
  filePreview.style.display = 'flex';
  fileNameDisplay.textContent = file.name;
}

removeFileBtn.addEventListener('click', () => {
  selectedFile = null;
  resumeFileInput.value = '';
  
  // Update UI
  uploadArea.style.display = 'block';
  filePreview.style.display = 'none';
  uploadProgressContainer.style.display = 'none';
  uploadProgressBar.style.width = '0%';
});

// Helper function to upload file via XHR to show progress
async function uploadResumeToServer(file) {
  return new Promise((resolve, reject) => {
    uploadProgressContainer.style.display = 'block';
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload-resume', true);
    
    xhr.upload.onprogress = function(e) {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        uploadProgressBar.style.width = percentComplete + '%';
      }
    };
    
    xhr.onload = function() {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve(response);
      } else {
        const response = JSON.parse(xhr.responseText);
        reject(new Error(response.message || 'File upload failed.'));
      }
    };
    
    xhr.onerror = function() {
      reject(new Error('Network error during file upload.'));
    };
    
    const formData = new FormData();
    formData.append('resume', file);
    
    xhr.send(formData);
  });
}

// Privacy Modal Logic
const privacyCheckbox = document.getElementById('privacy-agree');
const proceedPaymentBtn = document.getElementById('proceed-payment');
const cancelPaymentBtn = document.getElementById('cancel-payment');
const privacyModal = document.getElementById('privacy-modal');

privacyCheckbox.addEventListener('change', (e) => {
  if (e.target.checked) {
    proceedPaymentBtn.disabled = false;
    proceedPaymentBtn.classList.remove('btn-disabled');
  } else {
    proceedPaymentBtn.disabled = true;
    proceedPaymentBtn.classList.add('btn-disabled');
  }
});

cancelPaymentBtn.addEventListener('click', () => {
  privacyModal.classList.remove('show');
  privacyCheckbox.checked = false;
  proceedPaymentBtn.disabled = true;
  proceedPaymentBtn.classList.add('btn-disabled');
});

// Form Submit - Shows Modal First
form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (selectedDomain.value === "") {
    alert("⚠️ Please select an internship domain.");
    return;
  }

  if (!selectedFile) {
    alert("⚠️ Please upload your resume (PDF only).");
    return;
  }

  privacyModal.classList.add('show');
});

proceedPaymentBtn.addEventListener('click', () => {
  privacyModal.classList.remove('show');
  
  // Calculate price based on plan
  let amount = 299; // default Gold
  const plan = document.getElementById("selectedPlan").value;
  if (plan === "Normal") amount = 199;
  else if (plan === "Premium") amount = 399;
  
  document.getElementById("upi-amount").textContent = amount;
  
  // Generate UPI URI and QR code
  const upiId = "aryajpatelssk@oksbi";
  const upiName = "NextGenZ Tech";
  const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${amount}&cu=INR`;
  
  // Set Mobile Deep Link
  document.getElementById("upi-deep-link").href = upiString;
  document.getElementById("upi-mobile-button").href = upiString;
  
  // Generate QR using API
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiString)}`;
  document.getElementById("upi-qr-image").src = qrApiUrl;
  
  // Show UPI Modal
  document.getElementById("upi-modal").classList.add('show');
});

// Handle UPI Modal
const cancelUpiBtn = document.getElementById("cancel-upi");
const submitUpiBtn = document.getElementById("submit-upi-btn");
const upiModal = document.getElementById("upi-modal");
const utrInput = document.getElementById("utr-input");

cancelUpiBtn.addEventListener('click', () => {
  upiModal.classList.remove('show');
});

submitUpiBtn.addEventListener('click', async () => {
  const utr = utrInput.value.trim();
  if (utr.length < 8) {
    alert("⚠️ Please enter a valid UTR / Transaction ID.");
    return;
  }
  
  upiModal.classList.remove('show');
  setLoading(true);

  try {
    // 1. Upload Resume
    buttonText.textContent = "Uploading Resume...";
    const uploadData = await uploadResumeToServer(selectedFile);
    
    // 2. Collect form data
    buttonText.textContent = "Processing Application...";
    const applicationData = {
      fullName: document.getElementById("fullName").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      college: document.getElementById("college").value,
      course: document.getElementById("course").value,
      year: document.getElementById("year").value,
      domain: selectedDomain.value,
      plan: document.getElementById("selectedPlan").value,
      resume: {
        url: uploadData.fileUrl,
        publicId: uploadData.publicId,
        fileName: selectedFile.name
      },
      linkedin: document.getElementById("linkedin").value,
      github: document.getElementById("github").value,
      whyJoin: document.getElementById("whyJoin").value,
      paymentId: utr // The UTR number from UPI
    };

    // 3. Submit directly to backend
    const submitResponse = await fetch("/api/submit-application", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(applicationData)
    });

    const submitData = await submitResponse.json();
    if (!submitResponse.ok) {
      throw new Error(submitData.error || submitData.message || "Failed to submit application.");
    }
    
    alert(`🎉 Thank you for applying at NextGenZ Tech!\n\nYour application and payment details have been submitted. You will receive an email shortly once verified! 🚀`);
    window.location.reload();

  } catch (error) {
    console.error("Error:", error);
    alert(`❌ ${error.message || "Failed to submit application. Please try again."}`);
    setLoading(false);
  }
});

// Helpers
function setLoading(isLoading) {
  if (isLoading) {
    submitButton.disabled = true;
    buttonText.textContent = "Processing...";
  } else {
    submitButton.disabled = false;
    buttonText.textContent = "Apply Now 🚀";
  }
}

// =========================================================================
//                              TESTIMONIALS CAROUSEL
// =========================================================================
function initCarousel() {
  const track = document.getElementById('testimonialTrack');
  const prevBtn = document.getElementById('prevTestimonial');
  const nextBtn = document.getElementById('nextTestimonial');
  const dotsContainer = document.getElementById('testimonialDots');

  if (track && prevBtn && nextBtn && dotsContainer) {
    dotsContainer.innerHTML = '';
    const cards = Array.from(track.children);
    if (cards.length === 0 || cards[0].tagName === 'P') return;

    const firstCard = cards[0];
    let currentIndex = 0;
    let autoPlayInterval;

    // Create dots
    cards.forEach((_, index) => {
      const dot = document.createElement('div');
      dot.classList.add('dot');
      if (index === 0) dot.classList.add('active');
      dot.addEventListener('click', () => goToSlide(index));
      dotsContainer.appendChild(dot);
    });

    const dots = Array.from(dotsContainer.children);

    function updateCarousel() {
      const dynamicCardWidth = firstCard.offsetWidth + 30;
      track.style.transform = `translateX(-${currentIndex * dynamicCardWidth}px)`;
      dots.forEach(dot => dot.classList.remove('active'));
      if (dots[currentIndex]) {
        dots[currentIndex].classList.add('active');
      }
    }

    function goToSlide(index) {
      currentIndex = index;
      updateCarousel();
      resetAutoPlay();
    }

    function nextSlide() {
      currentIndex++;
      if (currentIndex > cards.length - 1) {
        currentIndex = 0;
      }
      updateCarousel();
    }

    function prevSlide() {
      currentIndex--;
      if (currentIndex < 0) {
        currentIndex = cards.length - 1;
      }
      updateCarousel();
    }

    // Clone navigation buttons to avoid duplicate event listeners
    const newNextBtn = nextBtn.cloneNode(true);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
    const newPrevBtn = prevBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);

    newNextBtn.addEventListener('click', () => {
      nextSlide();
      resetAutoPlay();
    });

    newPrevBtn.addEventListener('click', () => {
      prevSlide();
      resetAutoPlay();
    });

    function startAutoPlay() {
      clearInterval(autoPlayInterval);
      autoPlayInterval = setInterval(nextSlide, 4000);
    }

    function resetAutoPlay() {
      clearInterval(autoPlayInterval);
      startAutoPlay();
    }

    startAutoPlay();
    
    // Pause on hover
    track.addEventListener('mouseenter', () => clearInterval(autoPlayInterval));
    track.addEventListener('mouseleave', startAutoPlay);

    // Initial positioning calculation
    updateCarousel();
  }
}

// =========================================================================
//                                   FAQ
// =========================================================================
const faqQuestions = document.querySelectorAll('.faq-question');
const faqSearch = document.getElementById('faqSearch');
const toggleAllFaq = document.getElementById('toggleAllFaq');

if (faqQuestions.length > 0) {
  // Accordion Logic
  faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
      const item = question.parentElement;
      const isActive = item.classList.contains('active');

      // Close all other FAQs
      document.querySelectorAll('.faq-item').forEach(i => {
        i.classList.remove('active');
        i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });

      if (!isActive) {
        item.classList.add('active');
        question.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Search Logic
  if(faqSearch) {
      faqSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        document.querySelectorAll('.faq-item').forEach(item => {
          const text = item.textContent.toLowerCase();
          if (text.includes(searchTerm)) {
            item.style.display = 'block';
          } else {
            item.style.display = 'none';
          }
        });
      });
  }

  // Expand/Collapse All
  if(toggleAllFaq) {
      let allExpanded = false;
      toggleAllFaq.addEventListener('click', () => {
        allExpanded = !allExpanded;
        toggleAllFaq.textContent = allExpanded ? 'Collapse All' : 'Expand All';
        
        document.querySelectorAll('.faq-item').forEach(item => {
          if (allExpanded) {
            item.classList.add('active');
            item.querySelector('.faq-question').setAttribute('aria-expanded', 'true');
          } else {
            item.classList.remove('active');
            item.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
          }
        });
      });
  }
}

// =========================================================================
//                  CUSTOM CURSOR & 3D TILT
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {

  // 3D Tilt Effect for Cards
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -10; // Max tilt 10deg
      const rotateY = ((x - centerX) / centerX) * 10;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
      card.style.transition = 'transform 0.5s ease, border-color 0.4s ease, box-shadow 0.4s ease';
    });
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'border-color 0.4s ease, box-shadow 0.4s ease'; // remove transform transition for smooth tracking
    });
  });
});

// =========================================================================
//                  SCROLL REVEAL & STAGGER ANIMATIONS FALLBACK
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Sibling Index Fallback for stagger animations
  if(!CSS.supports('animation-delay: calc(sibling-index() * 0.1s)')){
    const grids = document.querySelectorAll('.grid');
    grids.forEach(grid => {
      [...grid.children].forEach((el, index) => {
        el.style.setProperty('--sibling-index', index + 1);
      });
    });
  }

  // View Timeline Fallback for scroll entry effects
  if (!CSS.supports('(animation-timeline: view()) and (animation-range: entry 0% cover 100%)')) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const ratio = entry.intersectionRatio;
        
        if (ratio > 0.95) {
            entry.target.style.opacity = 1;
            entry.target.style.transform = 'perspective(1000px) rotateX(0deg) scale(1)';
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
        } else {
            entry.target.style.opacity = ratio;
            entry.target.style.transform = `perspective(1000px) rotateX(${-90 + ratio * 90}deg) scale(${0.8 + ratio * 0.2})`;
        }
      });
    }, { threshold: Array.from({length: 101}, (_, i) => i / 100) });

    document.querySelectorAll('.reveal, .card').forEach((el) => {
      // Prepare elements for JS animation
      el.style.opacity = '0';
      el.style.transform = 'perspective(1000px) rotateX(-90deg) scale(0.8)';
      el.style.backfaceVisibility = 'hidden';
      observer.observe(el);
    });
  }
});

// --- Review & Rating System --- //
const starIcons = document.querySelectorAll('.star-rating i');
const ratingInput = document.getElementById('reviewRating');

starIcons.forEach(star => {
  star.addEventListener('click', (e) => {
    const ratingValue = e.target.getAttribute('data-rating');
    ratingInput.value = ratingValue;
    
    starIcons.forEach(s => s.classList.remove('active'));
    e.target.classList.add('active');
    
    let previousSibling = e.target.previousElementSibling;
    while(previousSibling) {
      previousSibling.classList.add('active');
      previousSibling = previousSibling.previousElementSibling;
    }
  });
});

const reviewForm = document.getElementById('reviewForm');
const submitReviewBtn = document.getElementById('submitReviewBtn');

if (reviewForm) {
  reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitReviewBtn.innerHTML = 'Submitting... <i class="fas fa-spinner fa-spin"></i>';
    submitReviewBtn.disabled = true;

    try {
      const formData = new FormData();
      formData.append('fullName', document.getElementById('reviewName').value);
      formData.append('email', document.getElementById('reviewEmail').value);
      formData.append('domain', document.getElementById('reviewDomain').value);
      formData.append('rating', ratingInput.value);
      formData.append('review', document.getElementById('reviewText').value);

      const imageFile = document.getElementById('reviewImage').files[0];
      if (imageFile) {
        formData.append('profileImage', imageFile);
      }

      const response = await fetch('/api/reviews', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        alert("✅ Review submitted successfully! It is awaiting admin approval.");
        reviewForm.reset();
        starIcons.forEach(s => s.classList.remove('active'));
      } else {
        const msg = result.errors ? result.errors[0].msg : result.message;
        alert("❌ Error: " + msg);
      }
    } catch (error) {
      alert("❌ Submission failed. Please try again.");
      console.error(error);
    } finally {
      submitReviewBtn.innerHTML = 'Submit Review';
      submitReviewBtn.disabled = false;
    }
  });
}

async function loadTestimonials() {
  const track = document.getElementById('testimonialTrack');
  if (!track) return;
  
  try {
    const response = await fetch('/api/reviews');
    const result = await response.json();
    
    if (result.success && result.data.length > 0) {
      track.innerHTML = '';
      result.data.forEach(review => {
        let starsHtml = '';
        for(let i=0; i<5; i++) {
          if (i < review.rating) {
            starsHtml += '<i class="fas fa-star" style="color: #ffcc00;"></i>';
          } else {
            starsHtml += '<i class="fas fa-star" style="color: #555;"></i>';
          }
        }
        
        let avatarHtml = '';
        if (review.profileImage && review.profileImage.url) {
          avatarHtml = `<img src="${review.profileImage.url}" alt="${review.fullName}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">`;
        } else {
          const initials = review.fullName.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
          avatarHtml = `<div class="avatar">${initials}</div>`;
        }

        const card = document.createElement('div');
        card.className = 'testimonial-card';
        card.innerHTML = `
          <i class="fas fa-quote-left quote-icon"></i>
          <div class="stars">${starsHtml}</div>
          <p class="testimonial-text">"${review.review}"</p>
          <div class="student-profile">
            ${avatarHtml}
            <div class="student-info">
              <h4>${review.fullName}</h4>
              <span>${review.domain}</span>
            </div>
          </div>
        `;
        track.appendChild(card);
      });
      initCarousel();
    } else {
      track.innerHTML = '<p style="text-align: center; width: 100%; color: var(--text-color);">Check back soon for new testimonials!</p>';
    }
  } catch (error) {
    console.error("Error loading testimonials:", error);
    track.innerHTML = '<p style="text-align: center; width: 100%; color: var(--text-color);">Could not load testimonials at this time.</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // UPI requires no URL parameters upon completion, it just reloads.

  // Always scroll to top on refresh
  if (history.scrollRestoration) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);

  loadTestimonials();

  // Mobile Menu Toggle
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('active');
    });

    // Close menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });
  }

  // IntersectionObserver for Scroll Reveal Fallback/Implementation
  const revealElements = document.querySelectorAll('.reveal, .card, .domain-card, .plan-card, .founder-section');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  revealElements.forEach(el => {
    revealObserver.observe(el);
  });

  // Sticky Header Theme Switcher
  const header = document.querySelector('header');
  const darkSections = document.querySelectorAll('.bg-dark, footer');
  
  if (header && darkSections.length > 0) {
    window.addEventListener('scroll', () => {
      let isInDark = false;
      const headerRect = header.getBoundingClientRect();
      const headerBottom = headerRect.bottom;

      darkSections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= headerBottom && rect.bottom >= headerBottom) {
          isInDark = true;
        }
      });

      if (isInDark) {
        document.body.classList.add('bg-dark-active');
      } else {
        document.body.classList.remove('bg-dark-active');
      }
    });
  }
});