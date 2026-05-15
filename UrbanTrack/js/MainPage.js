
 function goStep(n) {
        if (n > currentStep) {
            if (currentStep === 1 && !selectedCategory)  { showToast('⚠️ Please select a category.'); return; }
            if (currentStep === 1 && !selectedSeverity)  { showToast('⚠️ Please select a severity level.'); return; }
            if (currentStep === 2 && !document.getElementById('issueTitle').value.trim()) { showToast('⚠️ Please add a title.'); return; }
            if (currentStep === 2 && !document.getElementById('issueDesc').value.trim())  { showToast('⚠️ Please add a description.'); return; }
            if (currentStep === 3 && !document.getElementById('issueAddress').value.trim()) { showToast('⚠️ Please enter the issue location.'); return; }
        }
        document.getElementById('step-'+currentStep).classList.remove('active');
        document.getElementById('dot-'+currentStep).classList.remove('active');
        document.getElementById('dot-'+currentStep).classList.add('done');
        currentStep = n;
        for (let i=1; i<n; i++) { document.getElementById('dot-'+i).classList.add('done'); document.getElementById('dot-'+i).classList.remove('active'); }
        for (let i=n+1; i<=4; i++) { document.getElementById('dot-'+i).classList.remove('done','active'); }
        document.getElementById('dot-'+n).classList.add('active');
        document.getElementById('dot-'+n).classList.remove('done');
        document.getElementById('step-'+n).classList.add('active');
        if (n === 4) buildReview();
    }
let selectedCategory = "";

document.querySelectorAll(".cat-btn").forEach(btn => {
    btn.onclick = function () {
        selectedCategory = btn.dataset.cat;
    }
});

document.querySelectorAll(".severity-btn").forEach(btn => {
    btn.onclick = function () {
        let severity = btn.dataset.sev;
        alert(severity + " severity selected for " + selectedCategory);
        goStep(2);
    }
});
