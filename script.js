// Data structure
let chamaData = {
    members: [],
    contributions: [],
    loans: [],
    repayments: [],
    admin: {
        password: 'admin123',
        defaultInterest: 10
    },
    settings: {
        defaultInterest: 10
    }
};

// Initialize or load data from localStorage
function loadData() {
    const savedData = localStorage.getItem('chamaData');
    if (savedData) {
        chamaData = JSON.parse(savedData);
        // Ensure settings exist
        if (!chamaData.settings) {
            chamaData.settings = { defaultInterest: 10 };
        }
    } else {
        // Add sample data for testing
        chamaData = {
            members: [
                { id: '1', name: 'John Doe', password: 'john123', phone: '0712345678', email: 'john@email.com' },
                { id: '2', name: 'Jane Smith', password: 'jane123', phone: '0723456789', email: 'jane@email.com' }
            ],
            contributions: [
                { id: '101', memberId: '1', amount: 1000, date: '2024-01-15', code: 'MPESA-QWERTY1', notes: 'January contribution' },
                { id: '102', memberId: '1', amount: 1000, date: '2024-02-15', code: 'MPESA-ASDFGH2', notes: 'February contribution' },
                { id: '103', memberId: '2', amount: 1000, date: '2024-01-15', code: 'MPESA-ZXCVBN3', notes: 'January contribution' }
            ],
            loans: [
                { 
                    id: '201', 
                    memberId: '1', 
                    amount: 5000, 
                    interest: 10, 
                    date: '2024-01-20', 
                    period: 6,
                    code: 'LOAN-001',
                    purpose: 'School fees'
                }
            ],
            repayments: [
                { 
                    id: '301', 
                    loanId: '201', 
                    amount: 1000, 
                    date: '2024-02-20',
                    code: 'MPESA-REPAY1',
                    notes: 'First repayment'
                }
            ],
            admin: {
                password: 'admin123',
                defaultInterest: 10
            },
            settings: {
                defaultInterest: 10
            }
        };
        saveData();
    }
    updateUserSelect();
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('chamaData', JSON.stringify(chamaData));
}

// Auto-save function
function autoSave() {
    saveData();
}

// Update user select dropdown
function updateUserSelect() {
    const userSelect = document.getElementById('userSelect');
    userSelect.innerHTML = '<option value="">Select User</option>';
    
    // Add admin option
    const adminOption = document.createElement('option');
    adminOption.value = 'admin';
    adminOption.textContent = '👑 Admin';
    userSelect.appendChild(adminOption);
    
    // Add members
    chamaData.members.forEach(member => {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = `👤 ${member.name}`;
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
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = member.name;
        contributionSelect.appendChild(option.cloneNode(true));
        loanSelect.appendChild(option.cloneNode(true));
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
    
    // Update member table
    updateMembersTable();
    
    // Update admin summary
    updateAdminSummary();
    
    // Update recent transactions
    updateRecentTransactions();
}

// Update members table
function updateMembersTable() {
    const tbody = document.querySelector('#membersTable tbody');
    tbody.innerHTML = '';
    
    let totalContributions = 0;
    let totalLoans = 0;
    let totalNet = 0;
    
    chamaData.members.forEach(member => {
        // Calculate member totals
        const memberContributions = chamaData.contributions
            .filter(c => c.memberId === member.id)
            .reduce((sum, c) => sum + c.amount, 0);
        
        const memberLoans = chamaData.loans.filter(l => l.memberId === member.id);
        let memberLoanBalance = 0;
        
        memberLoans.forEach(loan => {
            const repayments = chamaData.repayments
                .filter(r => r.loanId === loan.id)
                .reduce((sum, r) => sum + r.amount, 0);
            const totalDue = loan.amount * (1 + loan.interest / 100);
            memberLoanBalance += totalDue - repayments;
        });
        
        const netPosition = memberContributions - memberLoanBalance;
        
        totalContributions += memberContributions;
        totalLoans += memberLoanBalance;
        totalNet += netPosition;
        
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${member.name}</td>
            <td>${member.phone || '-'}</td>
            <td>${member.email || '-'}</td>
            <td>$${memberContributions.toFixed(2)}</td>
            <td>$${memberLoanBalance.toFixed(2)}</td>
            <td>$${netPosition.toFixed(2)}</td>
            <td>
                <button class="action-btn" onclick="viewMemberDetails('${member.id}')">View</button>
                <button class="action-btn edit" onclick="editMember('${member.id}')">Edit</button>
            </td>
        `;
    });
    
    document.getElementById('totalContributionsAll').textContent = `$${totalContributions.toFixed(2)}`;
    document.getElementById('totalLoansAll').textContent = `$${totalLoans.toFixed(2)}`;
    document.getElementById('totalNetAll').textContent = `$${totalNet.toFixed(2)}`;
}

// Update admin summary
function updateAdminSummary() {
    const totalContributions = chamaData.contributions.reduce((sum, c) => sum + c.amount, 0);
    const totalLoans = chamaData.loans.reduce((sum, l) => sum + l.amount, 0);
    const totalRepayments = chamaData.repayments.reduce((sum, r) => sum + r.amount, 0);
    
    // Calculate outstanding balance
    let outstandingBalance = 0;
    chamaData.loans.forEach(loan => {
        const repayments = chamaData.repayments
            .filter(r => r.loanId === loan.id)
            .reduce((sum, r) => sum + r.amount, 0);
        const totalDue = loan.amount * (1 + loan.interest / 100);
        outstandingBalance += totalDue - repayments;
    });
    
    document.getElementById('adminTotalContributions').textContent = `$${totalContributions.toFixed(2)}`;
    document.getElementById('adminTotalLoans').textContent = `$${totalLoans.toFixed(2)}`;
    document.getElementById('adminTotalRepayments').textContent = `$${totalRepayments.toFixed(2)}`;
    document.getElementById('adminOutstandingBalance').textContent = `$${outstandingBalance.toFixed(2)}`;
}

// Update recent transactions
function updateRecentTransactions() {
    const tbody = document.querySelector('#recentTransactionsTable tbody');
    tbody.innerHTML = '';
    
    // Combine all transactions
    const transactions = [];
    
    chamaData.contributions.forEach(c => {
        const member = chamaData.members.find(m => m.id === c.memberId);
        transactions.push({
            date: c.date,
            member: member ? member.name : 'Unknown',
            type: 'Contribution',
            amount: c.amount,
            reference: c.code || '-',
            notes: c.notes || '-'
        });
    });
    
    chamaData.loans.forEach(l => {
        const member = chamaData.members.find(m => m.id === l.memberId);
        transactions.push({
            date: l.date,
            member: member ? member.name : 'Unknown',
            type: 'Loan',
            amount: l.amount,
            reference: l.code || '-',
            notes: l.purpose || '-'
        });
    });
    
    chamaData.repayments.forEach(r => {
        const loan = chamaData.loans.find(l => l.id === r.loanId);
        const member = loan ? chamaData.members.find(m => m.id === loan.memberId) : null;
        transactions.push({
            date: r.date,
            member: member ? member.name : 'Unknown',
            type: 'Repayment',
            amount: r.amount,
            reference: r.code || '-',
            notes: r.notes || '-'
        });
    });
    
    // Sort by date (most recent first)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Show last 10 transactions
    transactions.slice(0, 10).forEach(t => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${new Date(t.date).toLocaleDateString()}</td>
            <td>${t.member}</td>
            <td><span class="transaction-type ${t.type.toLowerCase()}">${t.type}</span></td>
            <td>$${t.amount.toFixed(2)}</td>
            <td><span class="transaction-code">${t.reference}</span></td>
            <td>${t.notes}</td>
        `;
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
            document.getElementById('passwordInput').value = '';
        } else {
            error.textContent = '❌ Invalid admin password';
        }
    } else {
        const member = chamaData.members.find(m => m.id === userSelect.value);
        if (member && password === member.password) {
            showMemberSection(member);
            error.textContent = '';
            document.getElementById('passwordInput').value = '';
        } else {
            error.textContent = '❌ Invalid member password';
        }
    }
}

// Show admin section
function showAdminSection() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('memberSection').classList.add('hidden');
    document.getElementById('adminSection').classList.remove('hidden');
    showAdminTab('members');
}

// Show admin tab
function showAdminTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Show selected tab
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Refresh data if needed
    if (tabName === 'reports') {
        updateAdminSummary();
        updateRecentTransactions();
    }
}

// Show member section
function showMemberSection(member) {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('adminSection').classList.add('hidden');
    document.getElementById('memberSection').classList.remove('hidden');
    
    document.getElementById('memberNameDisplay').innerHTML = `👋 Welcome, ${member.name}`;
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
    
    if (memberContributions.length === 0) {
        contributionsBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No contributions yet</td></tr>';
    } else {
        memberContributions.forEach(contribution => {
            const row = contributionsBody.insertRow();
            row.innerHTML = `
                <td>${new Date(contribution.date).toLocaleDateString()}</td>
                <td>$${contribution.amount.toFixed(2)}</td>
                <td><span class="transaction-code">${contribution.code || '-'}</span></td>
                <td>${contribution.notes || '-'}</td>
            `;
        });
    }
    document.getElementById('totalContributions').textContent = `$${totalContributions.toFixed(2)}`;
    document.getElementById('memberTotalContributions').textContent = `$${totalContributions.toFixed(2)}`;
    
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
    let totalLoansTaken = 0;
    
    if (memberLoans.length === 0) {
        loansBody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No loans taken</td></tr>';
    } else {
        memberLoans.forEach(loan => {
            const loanRepayments = memberRepayments.filter(r => r.loanId === loan.id);
            const totalPaid = loanRepayments.reduce((sum, r) => sum + r.amount, 0);
            const totalDue = loan.amount * (1 + loan.interest / 100);
            const balance = totalDue - totalPaid;
            totalLoanBalance += balance;
            totalLoansTaken += loan.amount;
            
            const row = loansBody.insertRow();
            row.innerHTML = `
                <td>${new Date(loan.date).toLocaleDateString()}</td>
                <td>$${loan.amount.toFixed(2)}</td>
                <td>${loan.interest}%</td>
                <td>$${totalDue.toFixed(2)}</td>
                <td>$${totalPaid.toFixed(2)}</td>
                <td>$${balance.toFixed(2)}</td>
                <td><span class="transaction-code">${loan.code || '-'}</span></td>
                <td>${loan.purpose || '-'}</td>
            `;
        });
    }
    
    document.getElementById('totalLoanBalance').textContent = `$${totalLoanBalance.toFixed(2)}`;
    document.getElementById('memberOutstandingBalance').textContent = `$${totalLoanBalance.toFixed(2)}`;
    document.getElementById('memberTotalLoans').textContent = `$${totalLoansTaken.toFixed(2)}`;
    
    // Net position
    const netPosition = totalContributions - totalLoanBalance;
    document.getElementById('memberNetPosition').textContent = `$${netPosition.toFixed(2)}`;
}

// Admin functions
function addMember() {
    const name = document.getElementById('memberName').value.trim();
    const password = document.getElementById('memberPassword').value.trim();
    const phone = document.getElementById('memberPhone').value.trim();
    const email = document.getElementById('memberEmail').value.trim();
    
    if (!name || !password) {
        alert('❌ Please enter both name and password');
        return;
    }
    
    const newMember = {
        id: Date.now().toString(),
        name: name,
        password: password,
        phone: phone,
        email: email
    };
    
    chamaData.members.push(newMember);
    autoSave();
    updateUserSelect();
    updateAdminDropdowns();
    
    document.getElementById('memberName').value = '';
    document.getElementById('memberPassword').value = '';
    document.getElementById('memberPhone').value = '';
    document.getElementById('memberEmail').value = '';
    alert('✅ Member added successfully');
}

function addContribution() {
    const memberId = document.getElementById('contributionMember').value;
    const amount = parseFloat(document.getElementById('contributionAmount').value);
    const date = document.getElementById('contributionDate').value;
    const code = document.getElementById('contributionCode').value.trim();
    const notes = document.getElementById('contributionNotes').value.trim();
    
    if (!memberId || !amount || !date) {
        alert('❌ Please fill all required fields');
        return;
    }
    
    if (amount <= 0) {
        alert('❌ Amount must be positive');
        return;
    }
    
    const contribution = {
        id: Date.now().toString(),
        memberId: memberId,
        amount: amount,
        date: date,
        code: code || 'N/A',
        notes: notes || ''
    };
    
    chamaData.contributions.push(contribution);
    autoSave();
    updateAdminDropdowns();
    
    document.getElementById('contributionAmount').value = '';
    document.getElementById('contributionDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('contributionCode').value = '';
    document.getElementById('contributionNotes').value = '';
    alert('✅ Contribution added successfully');
}

function addLoan() {
    const memberId = document.getElementById('loanMember').value;
    const amount = parseFloat(document.getElementById('loanAmount').value);
    const date = document.getElementById('loanDate').value;
    const interest = parseFloat(document.getElementById('loanInterest').value);
    const period = parseInt(document.getElementById('loanPeriod').value);
    const code = document.getElementById('loanCode').value.trim();
    const purpose = document.getElementById('loanPurpose').value.trim();
    
    if (!memberId || !amount || !date || !interest || !period) {
        alert('❌ Please fill all required fields');
        return;
    }
    
    if (amount <= 0 || interest < 0 || period <= 0) {
        alert('❌ Please enter valid positive numbers');
        return;
    }
    
    const loan = {
        id: Date.now().toString(),
        memberId: memberId,
        amount: amount,
        date: date,
        interest: interest,
        period: period,
        code: code || 'N/A',
        purpose: purpose || ''
    };
    
    chamaData.loans.push(loan);
    autoSave();
    updateAdminDropdowns();
    
    document.getElementById('loanAmount').value = '';
    document.getElementById('loanDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('loanInterest').value = chamaData.settings.defaultInterest;
    document.getElementById('loanPeriod').value = '';
    document.getElementById('loanCode').value = '';
    document.getElementById('loanPurpose').value = '';
    alert('✅ Loan added successfully');
}

function addRepayment() {
    const loanId = document.getElementById('repaymentLoan').value;
    const amount = parseFloat(document.getElementById('repaymentAmount').value);
    const code = document.getElementById('repaymentCode').value.trim();
    const notes = document.getElementById('repaymentNotes').value.trim();
    
    if (!loanId || !amount) {
        alert('❌ Please fill all required fields');
        return;
    }
    
    if (amount <= 0) {
        alert('❌ Repayment amount must be positive');
        return;
    }
    
    const repayment = {
        id: Date.now().toString(),
        loanId: loanId,
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        code: code || 'N/A',
        notes: notes || ''
    };
    
    chamaData.repayments.push(repayment);
    autoSave();
    updateAdminDropdowns();
    
    document.getElementById('repaymentAmount').value = '';
    document.getElementById('repaymentCode').value = '';
    document.getElementById('repaymentNotes').value = '';
    alert('✅ Repayment added successfully');
}

// Settings functions
function changeAdminPassword() {
    const current = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;
    
    if (current !== chamaData.admin.password) {
        alert('❌ Current password is incorrect');
        return;
    }
    
    if (newPass.length < 6) {
        alert('❌ New password must be at least 6 characters');
        return;
    }
    
    if (newPass !== confirm) {
        alert('❌ New passwords do not match');
        return;
    }
    
    chamaData.admin.password = newPass;
    autoSave();
    
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    
    alert('✅ Password updated successfully');
}

function updateDefaultInterest() {
    const interest = parseFloat(document.getElementById('defaultInterest').value);
    
    if (interest < 0 || interest > 100) {
        alert('❌ Interest must be between 0 and 100');
        return;
    }
    
    chamaData.settings.defaultInterest = interest;
    autoSave();
    
    alert('✅ Default interest rate updated');
}

// Report generation
function generateReport(format) {
    const reportType = document.querySelector('input[name="reportType"]:checked').value;
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    
    let data = [];
    let filename = `chama-report-${new Date().toISOString().split('T')[0]}`;
    
    switch(reportType) {
        case 'summary':
            data = generateSummaryReport();
            filename += '-summary';
            break;
        case 'detailed':
            data = generateDetailedReport(startDate, endDate);
            filename += '-detailed';
            break;
        case 'loans':
            data = generateLoansReport();
            filename += '-loans';
            break;
    }
    
    if (format === 'excel') {
        exportToExcel(data, filename);
    } else if (format === 'csv') {
        exportToCSV(data, filename);
    } else if (format === 'print') {
        printReport(data, reportType);
    }
}

function generateSummaryReport() {
    const report = [];
    
    // Header
    report.push(['CHAMA SUMMARY REPORT']);
    report.push(['Generated:', new Date().toLocaleString()]);
    report.push([]);
    
    // Overall totals
    const totalContributions = chamaData.contributions.reduce((sum, c) => sum + c.amount, 0);
    const totalLoans = chamaData.loans.reduce((sum, l) => sum + l.amount, 0);
    const totalRepayments = chamaData.repayments.reduce((sum, r) => sum + r.amount, 0);
    
    report.push(['OVERALL TOTALS']);
    report.push(['Total Contributions:', `$${totalContributions.toFixed(2)}`]);
    report.push(['Total Loans Disbursed:', `$${totalLoans.toFixed(2)}`]);
    report.push(['Total Repayments:', `$${totalRepayments.toFixed(2)}`]);
    report.push([]);
    
    // Member breakdown
    report.push(['MEMBER BREAKDOWN']);
    report.push(['Name', 'Contributions', 'Loans', 'Balance', 'Net Position']);
    
    chamaData.members.forEach(member => {
        const contributions = chamaData.contributions
            .filter(c => c.memberId === member.id)
            .reduce((sum, c) => sum + c.amount, 0);
        
        let loanBalance = 0;
        const memberLoans = chamaData.loans.filter(l => l.memberId === member.id);
        memberLoans.forEach(loan => {
            const repayments = chamaData.repayments
                .filter(r => r.loanId === loan.id)
                .reduce((sum, r) => sum + r.amount, 0);
            const totalDue = loan.amount * (1 + loan.interest / 100);
            loanBalance += totalDue - repayments;
        });
        
        const netPosition = contributions - loanBalance;
        
        report.push([
            member.name,
            `$${contributions.toFixed(2)}`,
            `$${loanBalance.toFixed(2)}`,
            `$${(contributions - loanBalance).toFixed(2)}`
        ]);
    });
    
    return report;
}

function generateDetailedReport(startDate, endDate) {
    const report = [];
    
    report.push(['CHAMA DETAILED TRANSACTIONS REPORT']);
    report.push(['Generated:', new Date().toLocaleString()]);
    if (startDate && endDate) {
        report.push(['Date Range:', startDate, 'to', endDate]);
    }
    report.push([]);
    
    report.push(['Date', 'Member', 'Type', 'Amount', 'Reference', 'Notes']);
    
    // Filter and combine transactions
    const transactions = [];
    
    chamaData.contributions.forEach(c => {
        if (!startDate || (c.date >= startDate && c.date <= endDate)) {
            const member = chamaData.members.find(m => m.id === c.memberId);
            transactions.push({
                date: c.date,
                member: member ? member.name : 'Unknown',
                type: 'Contribution',
                amount: c.amount,
                reference: c.code || '-',
                notes: c.notes || '-'
            });
        }
    });
    
    chamaData.loans.forEach(l => {
        if (!startDate || (l.date >= startDate && l.date <= endDate)) {
            const member = chamaData.members.find(m => m.id === l.memberId);
            transactions.push({
                date: l.date,
                member: member ? member.name : 'Unknown',
                type: 'Loan',
                amount: l.amount,
                reference: l.code || '-',
                notes: l.purpose || '-'
            });
        }
    });
    
    chamaData.repayments.forEach(r => {
        if (!startDate || (r.date >= startDate && r.date <= endDate)) {
            const loan = chamaData.loans.find(l => l.id === r.loanId);
            const member = loan ? chamaData.members.find(m => m.id === loan.memberId) : null;
            transactions.push({
                date: r.date,
                member: member ? member.name : 'Unknown',
                type: 'Repayment',
                amount: r.amount,
                reference: r.code || '-',
                notes: r.notes || '-'
            });
        }
    });
    
    // Sort by date
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    transactions.forEach(t => {
        report.push([
            t.date,
            t.member,
            t.type,
            `$${t.amount.toFixed(2)}`,
            t.reference,
            t.notes
        ]);
    });
    
    return report;
}

function generateLoansReport() {
    const report = [];
    
    report.push(['CHAMA LOANS REPORT']);
    report.push(['Generated:', new Date().toLocaleString()]);
    report.push([]);
    
    report.push(['Member', 'Loan Date', 'Amount', 'Interest', 'Total Due', 'Paid', 'Balance', 'Status']);
    
    chamaData.members.forEach(member => {
        const memberLoans = chamaData.loans.filter(l => l.memberId === member.id);
        
        memberLoans.forEach(loan => {
            const repayments = chamaData.repayments
                .filter(r => r.loanId === loan.id)
                .reduce((sum, r) => sum + r.amount, 0);
            const totalDue = loan.amount * (1 + loan.interest / 100);
            const balance = totalDue - repayments;
            const status = balance <= 0 ? 'Paid' : 'Active';
            
            report.push([
                member.name,
                loan.date,
                `$${loan.amount.toFixed(2)}`,
                `${loan.interest}%`,
                `$${totalDue.toFixed(2)}`,
                `$${repayments.toFixed(2)}`,
                `$${balance.toFixed(2)}`,
                status
            ]);
        });
    });
    
    return report;
}

function exportToExcel(data, filename) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, filename + '.xlsx');
}

function exportToCSV(data, filename) {
    const csv = data.map(row => 
        row.map(cell => {
            if (typeof cell === 'string' && cell.includes(',')) {
                return `"${cell}"`;
            }
            return cell;
        }).join(',')
    ).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename + '.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}

function printReport(data, reportType) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Chama Report - ${reportType}</title>
            <style>
                body { font-family: Arial; padding: 20px; }
                table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                th { background: #667eea; color: white; padding: 10px; }
                td { border: 1px solid #ddd; padding: 8px; }
                h1 { color: #333; }
                .header { margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <h1>Chama Management System - Report</h1>
            <div class="header">
                <p>Generated: ${new Date().toLocaleString()}</p>
                <p>Report Type: ${reportType}</p>
            </div>
            <table>
                ${data.map(row => {
                    if (row.length === 1) {
                        return `<tr><th colspan="100%">${row[0]}</th></tr>`;
                    } else if (row[0] === 'Generated:' || row[0] === 'Date Range:') {
                        return `<tr><td colspan="100%"><strong>${row[0]}</strong> ${row.slice(1).join(' ')}</td></tr>`;
                    } else {
                        return `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
                    }
                }).join('')}
            </table>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Member functions
function downloadMemberStatement() {
    const memberId = chamaData.members.find(m => 
        m.name === document.getElementById('memberNameDisplay').textContent.replace('👋 Welcome, ', '')
    )?.id;
    
    if (!memberId) return;
    
    const member = chamaData.members.find(m => m.id === memberId);
    const report = [];
    
    report.push(['CHAMA MEMBER STATEMENT']);
    report.push(['Member:', member.name]);
    report.push(['Generated:', new Date().toLocaleString()]);
    report.push([]);
    
    report.push(['CONTRIBUTIONS']);
    report.push(['Date', 'Amount', 'Reference', 'Notes']);
    
    const contributions = chamaData.contributions
        .filter(c => c.memberId === memberId)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    contributions.forEach(c => {
        report.push([c.date, `$${c.amount.toFixed(2)}`, c.code || '-', c.notes || '-']);
    });
    
    const totalContributions = contributions.reduce((sum, c) => sum + c.amount, 0);
    report.push(['TOTAL CONTRIBUTIONS:', `$${totalContributions.toFixed(2)}`]);
    report.push([]);
    
    report.push(['LOANS']);
    report.push(['Date', 'Amount', 'Interest', 'Purpose', 'Status']);
    
    const loans = chamaData.loans
        .filter(l => l.memberId === memberId)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    loans.forEach(loan => {
        const repayments = chamaData.repayments
            .filter(r => r.loanId === loan.id)
            .reduce((sum, r) => sum + r.amount, 0);
        const totalDue = loan.amount * (1 + loan.interest / 100);
        const balance = totalDue - repayments;
        const status = balance <= 0 ? 'Paid' : 'Active';
        
        report.push([loan.date, `$${loan.amount.toFixed(2)}`, `${loan.interest}%`, loan.purpose || '-', status]);
    });
    
    exportToExcel(report, `member-statement-${member.name}-${new Date().toISOString().split('T')[0]}`);
}

// Data backup functions
function exportData() {
    if (document.getElementById('adminSection').classList.contains('hidden')) {
        alert('❌ Only admin can export data');
        return;
    }
    
    const exportObj = {
        members: chamaData.members,
        contributions: chamaData.contributions,
        loans: chamaData.loans,
        repayments: chamaData.repayments,
        settings: chamaData.settings,
        exportDate: new Date().toISOString(),
        version: '2.0'
    };
    
    const dataStr = JSON.stringify(exportObj, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportDate = new Date();
    const fileName = `chama-backup-${exportDate.getFullYear()}-${(exportDate.getMonth()+1).toString().padStart(2,'0')}-${exportDate.getDate().toString().padStart(2,'0')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', fileName);
    linkElement.click();
    
    alert('✅ Backup downloaded successfully!');
}

function importData() {
    if (document.getElementById('adminSection').classList.contains('hidden')) {
        alert('❌ Only admin can restore backups');
        return;
    }
    
    document.getElementById('importFile').click();
}

// Handle file selection for import
document.getElementById('importFile').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (!importedData.members || !importedData.contributions || !importedData.loans) {
                throw new Error('Invalid backup file format');
            }
            
            if (confirm('⚠️ This will REPLACE all current data. Make sure you have a backup of current data first!\n\nClick OK to proceed.')) {
                chamaData = {
                    members: importedData.members || [],
                    contributions: importedData.contributions || [],
                    loans: importedData.loans || [],
                    repayments: importedData.repayments || [],
                    admin: chamaData.admin,
                    settings: importedData.settings || { defaultInterest: 10 }
                };
                
                autoSave();
                updateUserSelect();
                updateAdminDropdowns();
                
                alert('✅ Data restored successfully!');
            }
        } catch (error) {
            alert('❌ Error importing file: ' + error.message);
        }
    };
    reader.readAsText(file);
    
    event.target.value = '';
});

function resetData() {
    if (document.getElementById('adminSection').classList.contains('hidden')) {
        alert('❌ Only admin can reset data');
        return;
    }
    
    const password = prompt('⚠️ DANGER ZONE\n\nType "RESET" to confirm deleting ALL data:');
    
    if (password === 'RESET') {
        if (confirm('FINAL WARNING: This cannot be undone! Are you absolutely sure?')) {
            chamaData = {
                members: [],
                contributions: [],
                loans: [],
                repayments: [],
                admin: chamaData.admin,
                settings: chamaData.settings
            };
            
            autoSave();
            updateUserSelect();
            updateAdminDropdowns();
            
            alert('✅ All data has been reset');
            logout();
        }
    } else if (password !== null) {
        alert('❌ Reset cancelled - incorrect confirmation');
    }
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
    
    // Set today's date as default for date inputs
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('contributionDate').value = today;
    document.getElementById('loanDate').value = today;
    document.getElementById('reportStartDate').value = new Date(new Date().setMonth(new Date().getMonth()-1)).toISOString().split('T')[0];
    document.getElementById('reportEndDate').value = today;
    document.getElementById('defaultInterest').value = chamaData.settings?.defaultInterest || 10;
};
