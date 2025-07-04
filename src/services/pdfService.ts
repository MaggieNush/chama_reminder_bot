import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Member, Payment } from '../types/bot';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export class PDFService {
  static generateMemberSummaryPDF(members: Member[], payments: Payment[]): void {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Chama Member Summary Report', 20, 30);
    
    // Date
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);
    
    // Summary Statistics
    const totalMembers = members.length;
    const totalContributions = members.reduce((sum, m) => sum + m.totalContributed, 0);
    const averageContribution = totalContributions / totalMembers;
    const activeMembers = members.filter(m => m.currentBalance >= 0).length;
    
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Summary Statistics', 20, 65);
    
    doc.setFontSize(11);
    doc.text(`Total Members: ${totalMembers}`, 20, 80);
    doc.text(`Active Members: ${activeMembers}`, 20, 90);
    doc.text(`Members Behind: ${totalMembers - activeMembers}`, 20, 100);
    doc.text(`Total Contributions: KSh ${totalContributions.toLocaleString()}`, 20, 110);
    doc.text(`Average Contribution: KSh ${averageContribution.toLocaleString()}`, 20, 120);
    
    // Member Details Table
    const memberData = members.map(member => {
      const memberPayments = payments.filter(p => p.memberId === member.id);
      const lastPayment = memberPayments.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
      
      return [
        member.name,
        member.phone,
        `KSh ${member.totalContributed.toLocaleString()}`,
        `KSh ${member.currentBalance.toLocaleString()}`,
        memberPayments.length.toString(),
        lastPayment ? lastPayment.date.toLocaleDateString() : 'Never',
        member.currentBalance >= 0 ? 'Up to Date' : 'Behind'
      ];
    });
    
    doc.autoTable({
      startY: 140,
      head: [['Name', 'Phone', 'Total Contributed', 'Balance', 'Payments', 'Last Payment', 'Status']],
      body: memberData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 15 },
        5: { cellWidth: 25 },
        6: { cellWidth: 20 }
      }
    });
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
      doc.text('Chama Payment Reminder Bot', 20, doc.internal.pageSize.height - 10);
    }
    
    // Save the PDF
    doc.save(`chama-member-summary-${new Date().toISOString().split('T')[0]}.pdf`);
  }
  
  static generatePaymentReportPDF(payments: Payment[], members: Member[]): void {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Chama Payment Report', 20, 30);
    
    // Date
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);
    
    // Summary Statistics
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const completedPayments = payments.filter(p => p.status === 'completed');
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const averagePayment = completedPayments.length > 0 ? totalAmount / completedPayments.length : 0;
    
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Payment Summary', 20, 65);
    
    doc.setFontSize(11);
    doc.text(`Total Payments: ${payments.length}`, 20, 80);
    doc.text(`Completed: ${completedPayments.length}`, 20, 90);
    doc.text(`Pending: ${pendingPayments.length}`, 20, 100);
    doc.text(`Total Amount: KSh ${totalAmount.toLocaleString()}`, 20, 110);
    doc.text(`Average Payment: KSh ${averagePayment.toLocaleString()}`, 20, 120);
    
    // Payment Details Table
    const paymentData = payments.map(payment => {
      const member = members.find(m => m.id === payment.memberId);
      return [
        payment.date.toLocaleDateString(),
        member?.name || 'Unknown',
        member?.phone || '',
        `KSh ${payment.amount.toLocaleString()}`,
        payment.method,
        payment.reference,
        payment.status
      ];
    });
    
    doc.autoTable({
      startY: 140,
      head: [['Date', 'Member', 'Phone', 'Amount', 'Method', 'Reference', 'Status']],
      body: paymentData,
      theme: 'striped',
      headStyles: { fillColor: [34, 197, 94] },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 20 },
        5: { cellWidth: 25 },
        6: { cellWidth: 20 }
      }
    });
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
      doc.text('Chama Payment Reminder Bot', 20, doc.internal.pageSize.height - 10);
    }
    
    // Save the PDF
    doc.save(`chama-payment-report-${new Date().toISOString().split('T')[0]}.pdf`);
  }
  
  static generateIndividualMemberPDF(member: Member, payments: Payment[]): void {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text(`Member Report: ${member.name}`, 20, 30);
    
    // Date
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);
    
    // Member Information
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Member Information', 20, 65);
    
    doc.setFontSize(11);
    doc.text(`Name: ${member.name}`, 20, 80);
    doc.text(`Phone: ${member.phone}`, 20, 90);
    doc.text(`Email: ${member.email}`, 20, 100);
    doc.text(`Join Date: ${member.joinDate.toLocaleDateString()}`, 20, 110);
    doc.text(`Total Contributed: KSh ${member.totalContributed.toLocaleString()}`, 20, 120);
    doc.text(`Current Balance: KSh ${member.currentBalance.toLocaleString()}`, 20, 130);
    
    // Payment History
    const memberPayments = payments.filter(p => p.memberId === member.id);
    
    if (memberPayments.length > 0) {
      doc.setFontSize(14);
      doc.text('Payment History', 20, 155);
      
      const paymentData = memberPayments.map(payment => [
        payment.date.toLocaleDateString(),
        `KSh ${payment.amount.toLocaleString()}`,
        payment.method,
        payment.reference,
        payment.status
      ]);
      
      doc.autoTable({
        startY: 170,
        head: [['Date', 'Amount', 'Method', 'Reference', 'Status']],
        body: paymentData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 10 }
      });
    } else {
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text('No payment history available', 20, 170);
    }
    
    // Save the PDF
    doc.save(`member-report-${member.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`);
  }
}