// ===== Navigation Scroll Effect =====
document.addEventListener("DOMContentLoaded", function () {
  const navbar = document.getElementById("navbar");

  function handleScroll() {
    if (window.scrollY > 20) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  }

  window.addEventListener("scroll", handleScroll);
  handleScroll(); // Check initial state

  // ===== Mobile Menu Toggle =====
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileNav = document.getElementById("mobile-nav");
  const menuIcon = mobileMenuBtn.querySelector(".menu-icon");
  const closeIcon = mobileMenuBtn.querySelector(".close-icon");

  if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener("click", function () {
      mobileNav.classList.toggle("active");
      menuIcon.classList.toggle("hidden");
      closeIcon.classList.toggle("hidden");
    });

    // Close mobile menu when clicking a link
    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mobileNav.classList.remove("active");
        menuIcon.classList.remove("hidden");
        closeIcon.classList.add("hidden");
      });
    });
  }

  // ===== Smooth Scroll for Anchor Links =====
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href !== "#") {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }
    });
  });

  // ===== ROI Calculator =====
  const teamSlider = document.getElementById("team-slider");
  const employeeCountEl = document.getElementById("employee-count");
  const hoursSavedEl = document.getElementById("hours-saved");
  const moneySavedEl = document.getElementById("money-saved");

  function calculateSavings(employeesCount) {
    const hoursSaved = employeesCount * 2 * 4; // 2 hours per employee per week * 4 weeks
    const moneySaved = hoursSaved * 55; // $55 per hour
    return {
      hours: hoursSaved.toFixed(0),
      money: Math.round(moneySaved).toLocaleString(),
    };
  }

  function updateCalculator() {
    if (!teamSlider) return;

    const employeesCount = parseInt(teamSlider.value);
    const savings = calculateSavings(employeesCount);

    if (employeeCountEl) {
      employeeCountEl.textContent = `${employeesCount} Members`;
    }
    if (hoursSavedEl) {
      hoursSavedEl.textContent = `${savings.hours}h`;
    }
    if (moneySavedEl) {
      moneySavedEl.textContent = `$${savings.money}`;
    }
  }

  if (teamSlider) {
    teamSlider.addEventListener("input", updateCalculator);
    updateCalculator(); // Initialize with default value
  }

  // ===== Form Handling =====
  const contactForm = document.querySelector(".contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const formData = new FormData(contactForm);
      const data = Object.fromEntries(formData);

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Sending...";
      submitBtn.disabled = true;

      try {
        // In production, this would POST to your backend API
        await new Promise((resolve) => setTimeout(resolve, 1000));

        alert("Thank you for your message! We'll get back to you soon.");
        contactForm.reset();
      } catch (error) {
        alert(
          "Sorry, there was an error sending your message. Please try again.",
        );
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  // ===== Newsletter Form Handling =====
  const newsletterForm = document.querySelector(".newsletter-form-footer");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const emailInput = newsletterForm.querySelector('input[type="email"]');

      try {
        // In production, this would POST to your backend API
        await new Promise((resolve) => setTimeout(resolve, 1000));

        alert("Thank you for subscribing!");
        emailInput.value = "";
      } catch (error) {
        alert("Sorry, there was an error. Please try again.");
      }
    });
  }
});
