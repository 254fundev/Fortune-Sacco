// Data structure
let chamaData = {
    members: [],
    contributions: [],
    loans: [],
    repayments: [],
    admin: {
        password: 'admin123' // Default admin password
    }
};

// Initialize or load data from localStorage
function loadData() {
    const savedData = localStorage.getItem('chamaData');
    if (savedData) {
        chamaData = JSON.parse(savedData);
    } else {
        // Add default admin
        saveData();
    }
    updateUserSelect();
}

function saveData() {
    localStorage.setItem('chamaData', JSON.stringify(chamaData));
}

// Update user select dropdown
function updateUserSelect() {
    const userSelect = document.getElementById('userSelect');
    userSelect.innerHTML = '<option value="">Select User</option>';
    
    // Add admin option
    const adminOption = document.createElement('option');
    adminOption.value = 'admin';
    adminOption.textContent = 'Admin';
    userSelect.appendChild(adminOption);
    
    // Add members
    chamaData.members.forEach(member => {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = member.name;
        userSelect.appendChild(option);
    });
}

// Update admin dropdowns
function updateAdminDropdowns() {
    const contributionSelect = document.getElementById('contributionMember');
    const loanSelect = document.getElementById('loanMember');
    const repaymentSelect = document.getElementById('repaymentLoan');
    
    contributionSelect.innerHTML = '<option value="">Select Member</option>';
    loanSelect.innerHTML = '<option value="">Select Member</option>';
    repaymentSelect.innerHTML = '<option value="">Select Loan</option>';
    
    chamaData.members.forEach(member => {
        const option1 = document.createElement('option');
        option1.value = member.id;
        option1.textContent = member.name;
        contributionSelect.appendChild(option1.cloneNode(true));
        loanSelect.appendChild(option1.cloneNode(true));
    });
    
    // Update repayment loans
    chamaData.loans.forEach(loan => {
        const member = chamaData.members.find(m => m.id === loan.memberId);
        if (member) {
            const option = document.createElement('option');
            option.value = loan.id;
            option.textContent = `${member.name} - $${loan.amount} (${new Date(loan.date).toLocaleDateString()})`;
            repaymentSelect.appendChild(option);
        }
    });
}

// Login function
function login() {
    const userSelect = document.getElementById('userSelect');
    const password = document.getElementById('passwordInput').value;
    const error = document.getElementById('loginError');
    
    if (!userSelect.value) {
        error.textContent = 'Please select a user';
        return;
    }
    
    if (userSelect.value === 'admin') {
        if (password === chamaData.admin.password) {
            showAdminSection();
            updateAdminDropdowns();
            error.textContent = '';
        } else {
            error.textContent = 'Invalid admin password';
        }
    } else {
        const member = chamaData.members.find(m => m.id === userSelect.value);
        if (member && password === member.password) {
            showMemberSection(member);
            error.textContent = '';
        } else {
            error.textContent = 'Invalid member password';
        }
    }
}

// Show admin section
function showAdminSection() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('memberSection').classList.add('hidden');
    document.getElementById('adminSection').classList.remove('hidden');
}

// Show member section
function showMemberSection(member) {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('adminSection').classList.add('hidden');
    document.getElementById('memberSection').classList.remove('hidden');
    
    document.getElementById('memberNameDisplay').textContent = `Welcome, ${member.name}`;
    displayMemberData(member.id);
}

// Display member data
function displayMemberData(memberId) {
    // Filter contributions
    const memberContributions = chamaData.contributions.filter(c => c.memberId === memberId);
    const totalContributions = memberContributions.reduce((sum, c) => sum + c.amount, 0);
    
    // Display contributions
    const contributionsBody = document.querySelector('#contributionsTable tbody');
    contributionsBody.innerHTML = '';
    memberContributions.forEach(contribution => {
        const row = contributionsBody.insertRow();
        row.innerHTML = `
            <td>${new Date(contribution.date).toLocaleDateString()}</td>
            <td>$${contribution.amount.toFixed(2)}</td>
        `;
    });
    document.getElementById('totalContributions').textContent = `$${totalContributions.toFixed(2)}`;
    
    // Filter loans
    const memberLoans = chamaData.loans.filter(l => l.memberId === memberId);
    const memberRepayments = chamaData.repayments.filter(r => {
        const loan = chamaData.loans.find(l => l.id === r.loanId);
        return loan && loan.memberId === memberId;
    });
    
    // Display loans
    const loansBody = document.querySelector('#loansTable tbody');
    loansBody.innerHTML = '';
    let totalLoanBalance = 0;
    
    memberLoans.forEach(loan => {
        const loanRepayments = memberRepayments.filter(r => r.loanId === loan.id);
        const totalPaid = loanRepayments.reduce((sum, r) => sum + r.amount, 0);
        const totalDue = loan.amount * (1 + loan.interest / 100);
        const balance = totalDue - totalPaid;
        totalLoanBalance += balance;
        
        const row = loansBody.insertRow();
        row.innerHTML = `
            <td>${new Date(loan.date).toLocaleDateString()}</td>
            <td>$${loan.amount.toFixed(2)}</td>
            <td>${loan.interest}%</td>
            <td>$${totalDue.toFixed(2)}</td>
            <td>$${totalPaid.toFixed(2)}</td>
            <td>$${balance.toFixed(2)}</td>
        `;
    });
    
    document.getElementById('totalLoanBalance').textContent = `$${totalLoanBalance.toFixed(2)}`;
    
    // Update summary
    const totalLoansTaken = memberLoans.reduce((sum, l) => sum + l.amount, 0);
    document.getElementById('summaryContributions').textContent = `$${totalContributions.toFixed(2)}`;
    document.getElementById('summaryLoans').textContent = `$${totalLoansTaken.toFixed(2)}`;
    document.getElementById('summaryBalance').textContent = `$${totalLoanBalance.toFixed(2)}`;
    document.getElementById('netPosition').textContent = `$${(totalContributions - totalLoanBalance).toFixed(2)}`;
}

// Admin functions
function addMember() {
    const name = document.getElementById('memberName').value;
    const password = document.getElementById('memberPassword').value;
    
    if (!name || !password) {
        alert('Please enter both name and password');
        return;
    }
    
    const newMember = {
        id: Date.now().toString(),
        name: name,
        password: password
    };
    
    chamaData.members.push(newMember);
    saveData();
    updateUserSelect();
    updateAdminDropdowns();
    
    document.getElementById('memberName').value = '';
    document.getElementById('memberPassword').value = '';
    alert('Member added successfully');
}

function addContribution() {
    const memberId = document.getElementById('contributionMember').value;
    const amount = parseFloat(document.getElementById('contributionAmount').value);
    const date = document.getElementById('contributionDate').value;
    
    if (!memberId || !amount || !date) {
        alert('Please fill all fields');
        return;
    }
    
    const contribution = {
        id: Date.now().toString(),
        memberId: memberId,
        amount: amount,
        date: date
    };
    
    chamaData.contributions.push(contribution);
    saveData();
    updateAdminDropdowns();
    
    document.getElementById('contributionAmount').value = '';
    document.getElementById('contributionDate').value = '';
    alert('Contribution added successfully');
}

function addLoan() {
    const memberId = document.getElementById('loanMember').value;
    const amount = parseFloat(document.getElementById('loanAmount').value);
    const date = document.getElementById('loanDate').value;
    const interest = parseFloat(document.getElementById('loanInterest').value);
    const period = parseInt(document.getElementById('loanPeriod').value);
    
    if (!memberId || !amount || !date || !interest || !period) {
        alert('Please fill all fields');
        return;
    }
    
    const loan = {
        id: Date.now().toString(),
        memberId: memberId,
        amount: amount,
        date: date,
        interest: interest,
        period: period
    };
    
    chamaData.loans.push(loan);
    saveData();
    updateAdminDropdowns();
    
    document.getElementById('loanAmount').value = '';
    document.getElementById('loanDate').value = '';
    document.getElementById('loanInterest').value = '10';
    document.getElementById('loanPeriod').value = '';
    alert('Loan added successfully');
}

function addRepayment() {
    const loanId = document.getElementById('repaymentLoan').value;
    const amount = parseFloat(document.getElementById('repaymentAmount').value);
    
    if (!loanId || !amount) {
        alert('Please fill all fields');
        return;
    }
    
    const repayment = {
        id: Date.now().toString(),
        loanId: loanId,
        amount: amount,
        date: new Date().toISOString().split('T')[0]
    };
    
    chamaData.repayments.push(repayment);
    saveData();
    updateAdminDropdowns();
    
    document.getElementById('repaymentAmount').value = '';
    alert('Repayment added successfully');
}

// Logout function
function logout() {
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('adminSection').classList.add('hidden');
    document.getElementById('memberSection').classList.add('hidden');
    document.getElementById('passwordInput').value = '';
    document.getElementById('userSelect').value = '';
}

// Initialize on load
window.onload = function() {
    loadData();
};
