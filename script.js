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
        // Add sample data for testing
        chamaData = {
            members: [
                { id: '1', name: 'John Doe', password: 'john123' },
                { id: '2', name: 'Jane Smith', password: 'jane123' }
            ],
            contributions: [
                { id: '101', memberId: '1', amount: 1000, date: '2024-01-15' },
                { id: '102', memberId: '1', amount: 1000, date: '2024-02-15' },
                { id: '103', memberId: '2', amount: 1000, date: '2024-01-15' }
            ],
            loans: [
                { id: '201', memberId: '1', amount: 5000, interest: 10, date: '2024-01-20', period: 6 }
            ],
            repayments: [
                { id: '301', loanId: '201', amount: 1000, date: '2024-02-20' }
            ],
            admin: {
                password: 'admin123'
            }
        };
        saveData();
    }
    updateUserSelect();
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('chamaData', JSON.stringify(chamaData));
    console.log('✅ Data saved at', new Date().toLocaleTimeString());
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
        contributionsBody.innerHTML = '<tr><td colspan="2" style="text-align: center;">No contributions yet</td></tr>';
    } else {
        memberContributions.forEach(contribution => {
            const row = contributionsBody.insertRow();
            row.innerHTML = `
                <td>${new Date(contribution.date).toLocaleDateString()}</td>
                <td>$${contribution.amount.toFixed(2)}</td>
            `;
        });
    }
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
    
    if (memberLoans.length === 0) {
        loansBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No loans taken</td></tr>';
    } else {
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
    }
    
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
    const name = document.getElementById('memberName').value.trim();
    const password = document.getElementById('memberPassword').value.trim();
    
    if (!name || !password) {
        alert('❌ Please enter both name and password');
        return;
    }
    
    const newMember = {
        id: Date.now().toString(),
        name: name,
        password: password
    };
    
    chamaData.members.push(newMember);
    autoSave();
    updateUserSelect();
    updateAdminDropdowns();
    
    document.getElementById('memberName').value = '';
    document.getElementById('memberPassword').value = '';
    alert('✅ Member added successfully');
}

function addContribution() {
    const memberId = document.getElementById('contributionMember').value;
    const amount = parseFloat(document.getElementById('contributionAmount').value);
    const date = document.getElementById('contributionDate').value;
    
    if (!memberId || !amount || !date) {
        alert('❌ Please fill all fields');
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
        date: date
    };
    
    chamaData.contributions.push(contribution);
    autoSave();
    updateAdminDropdowns();
    
    document.getElementById('contributionAmount').value = '';
    document.getElementById('contributionDate').value = '';
    alert('✅ Contribution added successfully');
}

function addLoan() {
    const memberId = document.getElementById('loanMember').value;
    const amount = parseFloat(document.getElementById('loanAmount').value);
    const date = document.getElementById('loanDate').value;
    const interest = parseFloat(document.getElementById('loanInterest').value);
    const period = parseInt(document.getElementById('loanPeriod').value);
    
    if (!memberId || !amount || !date || !interest || !period) {
        alert('❌ Please fill all fields');
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
        period: period
    };
    
    chamaData.loans.push(loan);
    autoSave();
    updateAdminDropdowns();
    
    document.getElementById('loanAmount').value = '';
    document.getElementById('loanDate').value = '';
    document.getElementById('loanInterest').value = '10';
    document.getElementById('loanPeriod').value = '';
    alert('✅ Loan added successfully');
}

function addRepayment() {
    const loanId = document.getElementById('repaymentLoan').value;
    const amount = parseFloat(document.getElementById('repaymentAmount').value);
    
    if (!loanId || !amount) {
        alert('❌ Please fill all fields');
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
        date: new Date().toISOString().split('T')[0]
    };
    
    chamaData.repayments.push(repayment);
    autoSave();
    updateAdminDropdowns();
    
    document.getElementById('repaymentAmount').value = '';
    alert('✅ Repayment added successfully');
}

// ============ DATA BACKUP FUNCTIONS ============

// Export data to JSON file
function exportData() {
    // Check if admin
    if (document.getElementById('adminSection').classList.contains('hidden')) {
        alert('❌ Only admin can export data');
        return;
    }
    
    // Get all data
    const exportObj = {
        members: chamaData.members,
        contributions: chamaData.contributions,
        loans: chamaData.loans,
        repayments: chamaData.repayments,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    // Convert to JSON string
    const dataStr = JSON.stringify(exportObj, null, 2);
    
    // Create download link
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    // Create filename with date
    const exportDate = new Date();
    const fileName = `chama-backup-${exportDate.getFullYear()}-${(exportDate.getMonth()+1).toString().padStart(2,'0')}-${exportDate.getDate().toString().padStart(2,'0')}.json`;
    
    // Trigger download
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', fileName);
    linkElement.click();
    
    alert('✅ Backup downloaded successfully!');
}

// Import data from JSON file
function importData() {
    // Check if admin
    if (document.getElementById('adminSection').classList.contains('hidden')) {
        alert('❌ Only admin can restore backups');
        return;
    }
    
    // Trigger file input
    document.getElementById('importFile').click();
}

// Handle file selection for import
document.getElementById('importFile').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            // Parse the JSON
            const importedData = JSON.parse(e.target.result);
            
            // Validate the data structure
            if (!importedData.members || !importedData.contributions || !importedData.loans) {
                throw new Error('Invalid backup file format');
            }
            
            // Confirm with user
            if (confirm('⚠️ This will REPLACE all current data. Make sure you have a backup of current data first!\n\nClick OK to proceed.')) {
                // Replace the data
                chamaData = {
                    members: importedData.members || [],
                    contributions: importedData.contributions || [],
                    loans: importedData.loans || [],
                    repayments: importedData.repayments || [],
                    admin: chamaData.admin // Keep existing admin password
                };
                
                // Save to localStorage
                autoSave();
                
                // Refresh displays
                updateUserSelect();
                updateAdminDropdowns();
                
                alert('✅ Data restored successfully!');
            }
        } catch (error) {
            alert('❌ Error importing file: ' + error.message);
        }
    };
    reader.readAsText(file);
    
    // Clear the input so the same file can be selected again
    event.target.value = '';
});

// Reset all data (admin only)
function resetData() {
    // Check if admin
    if (document.getElementById('adminSection').classList.contains('hidden')) {
        alert('❌ Only admin can reset data');
        return;
    }
    
    // Triple confirmation!
    const password = prompt('⚠️ DANGER ZONE\n\nType "RESET" to confirm deleting ALL data:');
    
    if (password === 'RESET') {
        if (confirm('FINAL WARNING: This cannot be undone! Are you absolutely sure?')) {
            // Clear all data but keep admin
            chamaData = {
                members: [],
                contributions: [],
                loans: [],
                repayments: [],
                admin: chamaData.admin
            };
            
            // Save empty data
            autoSave();
            
            // Refresh everything
            updateUserSelect();
            updateAdminDropdowns();
            
            alert('✅ All data has been reset');
            
            // Logout
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
};
