var cur = 1;
var userEmail = "";
var verifiedPasswordOtp = "";
var timerInterval = null;
var AUTH_API_BASE = "http://localhost:3000";

function postAuthJson(path, payload) {
  return fetch(AUTH_API_BASE + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
    .catch(function () {
      throw new Error(
        "Cannot reach the auth server. Start it with npm start, then try again.",
      );
    })
    .then(function (res) {
      return res
        .json()
        .catch(function () {
          return {};
        })
        .then(function (data) {
          if (!res.ok) {
            throw new Error(data.error || "Request failed. Please try again.");
          }

          return data;
        });
    });
}

function goTo(n) {
  document.getElementById("s" + cur).classList.remove("active");
  cur = n;
  document.getElementById("s" + n).classList.add("active");
}

/* ---- STEP 1 ---- */
function sendCode() {
  var em = document.getElementById("emailIn").value.trim();
  var errEl = document.getElementById("emailErr");

  if (!em) {
    errEl.textContent = "Please enter your email address.";
    errEl.style.display = "block";
    document.getElementById("emailIn").classList.add("err-border");
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
    errEl.textContent = "Please enter a valid email address.";
    errEl.style.display = "block";
    document.getElementById("emailIn").classList.add("err-border");
    return;
  }

  errEl.style.display = "none";
  document.getElementById("emailIn").classList.remove("err-border");
  userEmail = em;

  var btn = document.getElementById("sendBtn");
  var sp = document.getElementById("sp1");
  var txt = document.getElementById("sendTxt");
  btn.disabled = true;
  sp.style.display = "block";
  txt.textContent = "Sending…";

  postAuthJson("/api/email/password-otp", { email: em })
    .then(function () {
      btn.disabled = false;
      sp.style.display = "none";
      txt.textContent = "Send Reset Code";
      document.getElementById("otpSub").innerHTML =
        "We sent a 6-digit code to <strong>" +
        em +
        "</strong>. Check your inbox.";
      goTo(2);
      startTimer();
      toast("Code sent to " + em, "success");
    })
    .catch(function (error) {
      btn.disabled = false;
      sp.style.display = "none";
      txt.textContent = "Send Reset Code";
      console.error("Password OTP send error:", error);
      toast(error.message, "danger");
    });
}

document.getElementById("emailIn").addEventListener("keydown", function (e) {
  if (e.key === "Enter") sendCode();
});

/* ---- STEP 2 OTP ---- */
var boxes = document.querySelectorAll(".otp-box");

boxes.forEach(function (box, i) {
  box.addEventListener("input", function () {
    box.value = box.value.replace(/\D/g, "");
    if (box.value) {
      box.classList.add("filled");
      if (i < boxes.length - 1) boxes[i + 1].focus();
    } else {
      box.classList.remove("filled");
    }
    checkOtp();
  });

  box.addEventListener("keydown", function (e) {
    if (e.key === "Backspace" && !box.value && i > 0) {
      boxes[i - 1].focus();
      boxes[i - 1].value = "";
      boxes[i - 1].classList.remove("filled");
      checkOtp();
    }
  });

  box.addEventListener("paste", function (e) {
    e.preventDefault();
    var pasted = (e.clipboardData || window.clipboardData)
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    for (var j = 0; j < pasted.length; j++) {
      if (boxes[j]) {
        boxes[j].value = pasted[j];
        boxes[j].classList.add("filled");
      }
    }
    checkOtp();
    if (pasted.length >= 6) boxes[5].focus();
    else if (boxes[pasted.length]) boxes[pasted.length].focus();
  });
});

function checkOtp() {
  var full = true;
  boxes.forEach(function (b) {
    if (!b.value) full = false;
  });
  document.getElementById("verifyBtn").disabled = !full;
}

function verifyOtp() {
  var otp = Array.from(document.querySelectorAll(".otp-box"))
    .map(function (box) {
      return box.value.trim();
    })
    .join("");

  if (otp.length !== 6) {
    return;
  }

  var btn = document.getElementById("verifyBtn");
  var sp = document.getElementById("sp2");
  var txt = document.getElementById("verifyTxt");
  btn.disabled = true;
  sp.style.display = "block";
  txt.textContent = "Verifying…";

  postAuthJson("/api/email/verify-password-otp", {
    email: userEmail,
    otp: otp,
  })
    .then(function () {
      verifiedPasswordOtp = otp;
      btn.disabled = false;
      sp.style.display = "none";
      txt.textContent = "Verify Code";
      clearInterval(timerInterval);
      goTo(3);
      toast("Code verified! Set your new password.", "success");
    })
    .catch(function (error) {
      btn.disabled = false;
      sp.style.display = "none";
      txt.textContent = "Verify Code";
      console.error("OTP verification error:", error);
      toast(error.message, "danger");
    });
}

function startTimer() {
  var secs = 60;
  var timerEl = document.getElementById("timerTxt");
  var btn = document.getElementById("resendBtn");
  btn.disabled = true;
  timerEl.textContent = "60s";

  clearInterval(timerInterval);
  timerInterval = setInterval(function () {
    secs--;
    timerEl.textContent = secs + "s";
    if (secs <= 0) {
      clearInterval(timerInterval);
      btn.disabled = false;
      btn.innerHTML = "Resend Code";
    }
  }, 1000);
}

function resend() {
  boxes.forEach(function (b) {
    b.value = "";
    b.classList.remove("filled");
  });
  document.getElementById("verifyBtn").disabled = true;
  startTimer();
  toast("New code sent to " + userEmail, "success");
}

/* ---- STEP 3 PASSWORD ---- */
function eyeToggle(id, btn) {
  var inp = document.getElementById(id);
  var show = inp.type === "password";
  inp.type = show ? "text" : "password";
  btn.textContent = show ? "🙈" : "👁";
}

function checkStr() {
  var pw = document.getElementById("pw1").value;
  var fill = document.getElementById("strFill");
  var txt = document.getElementById("strTxt");
  var score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  var levels = [
    {
      w: "0%",
      c: "transparent",
      t: "Enter a password",
      tc: "rgba(255,255,255,0.3)",
    },
    { w: "25%", c: "#ef4444", t: "Weak", tc: "#ef4444" },
    { w: "50%", c: "#f59e0b", t: "Fair", tc: "#f59e0b" },
    { w: "75%", c: "#38bdf8", t: "Good", tc: "#38bdf8" },
    { w: "100%", c: "#10b981", t: "Strong \u2713", tc: "#10b981" },
  ];
  fill.style.width = levels[score].w;
  fill.style.background = levels[score].c;
  txt.textContent = levels[score].t;
  txt.style.color = levels[score].tc;
}

function checkMatch() {
  var p1 = document.getElementById("pw1").value;
  var p2 = document.getElementById("pw2").value;
  var hint = document.getElementById("matchHint");
  if (!p2) {
    hint.textContent = "";
    hint.className = "hint";
    return;
  }
  if (p1 === p2) {
    hint.textContent = "\u2713 Passwords match";
    hint.className = "hint ok";
    document.getElementById("pw2").classList.remove("err-border");
  } else {
    hint.textContent = "\u2717 Passwords do not match";
    hint.className = "hint err";
    document.getElementById("pw2").classList.add("err-border");
  }
}

function doReset() {
  var p1 = document.getElementById("pw1").value;
  var p2 = document.getElementById("pw2").value;

  if (p1.length < 8) {
    toast("Password must be at least 8 characters.", "danger");
    return;
  }
  if (p1 !== p2) {
    toast("Passwords do not match.", "danger");
    return;
  }

  var btn = document.getElementById("resetBtn");
  var sp = document.getElementById("sp3");
  var txt = document.getElementById("resetTxt");
  btn.disabled = true;
  sp.style.display = "block";
  txt.textContent = "Resetting…";

  postAuthJson("/api/email/reset-password", {
    email: userEmail,
    otp: verifiedPasswordOtp,
    password: p1,
  })
    .then(function () {
      btn.disabled = false;
      sp.style.display = "none";
      txt.textContent = "Reset Password";
      goTo(4);
      toast("Password reset successfully!", "success");
    })
    .catch(function (error) {
      btn.disabled = false;
      sp.style.display = "none";
      txt.textContent = "Reset Password";
      console.error("Password reset error:", error);
      toast(error.message, "danger");
    });
}

/* ---- TOAST ---- */
function toast(msg, type) {
  var el = document.getElementById("toast");
  el.textContent = msg;
  el.className = "toast " + (type || "info");
  el.style.display = "block";
  clearTimeout(el._t);
  el._t = setTimeout(function () {
    el.style.display = "none";
  }, 3500);
}

// Menu button toggle functionality
const menuBtn = document.querySelector(".menu-button");
const navLinks = document.querySelector(".nav-links");
let menuOpen = false;
menuBtn.addEventListener("click", () => {
  if (!menuOpen) {
    menuBtn.classList.add("open");
    navLinks.classList.add("show");
    menuOpen = true;
  } else {
    menuBtn.classList.remove("open");
    navLinks.classList.remove("show");
    menuOpen = false;
  }
});
