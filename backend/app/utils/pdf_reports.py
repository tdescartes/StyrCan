"""PDF report generation service using ReportLab."""

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from datetime import datetime
from typing import List, Dict, Any
import io
import logging

logger = logging.getLogger(__name__)


class PDFReportService:
    """Service for generating PDF reports."""
    
    @staticmethod
    def _create_header(company_name: str, report_title: str) -> List[Any]:
        """Create common report header."""
        styles = getSampleStyleSheet()
        header_style = ParagraphStyle(
            'CustomHeader',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        
        company_style = ParagraphStyle(
            'Company',
            parent=styles['Normal'],
            fontSize=14,
            textColor=colors.HexColor('#6b7280'),
            spaceAfter=10,
            alignment=TA_CENTER
        )
        
        elements = []
        elements.append(Paragraph(company_name, company_style))
        elements.append(Paragraph(report_title, header_style))
        elements.append(Spacer(1, 0.2 * inch))
        
        return elements
    
    @staticmethod
    def _create_footer(canvas, doc):
        """Create common report footer."""
        canvas.saveState()
        canvas.setFont('Helvetica', 9)
        canvas.setFillColor(colors.HexColor('#6b7280'))
        
        # Page number
        page_num = canvas.getPageNumber()
        text = f"Page {page_num}"
        canvas.drawRightString(7.5 * inch, 0.5 * inch, text)
        
        # Generation date
        date_text = f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        canvas.drawString(1 * inch, 0.5 * inch, date_text)
        
        canvas.restoreState()
    
    @staticmethod
    def generate_financial_report(
        company_name: str,
        report_data: Dict[str, Any],
        report_type: str = "Income Statement"
    ) -> bytes:
        """Generate a financial report PDF.
        
        Args:
            company_name: Name of the company
            report_data: Dictionary containing report data
            report_type: Type of report (Income Statement, Balance Sheet, etc.)
            
        Returns:
            PDF as bytes
        """
        try:
            # Create PDF buffer
            buffer = io.BytesIO()
            
            # Create document
            doc = SimpleDocTemplate(
                buffer,
                pagesize=letter,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=72
            )
            
            # Container for elements
            elements = []
            styles = getSampleStyleSheet()
            
            # Add header
            elements.extend(PDFReportService._create_header(company_name, report_type))
            
            # Date range
            if 'start_date' in report_data and 'end_date' in report_data:
                date_range = f"Period: {report_data['start_date']} to {report_data['end_date']}"
                date_style = ParagraphStyle(
                    'DateRange',
                    parent=styles['Normal'],
                    fontSize=11,
                    textColor=colors.HexColor('#374151'),
                    spaceAfter=20,
                    alignment=TA_CENTER
                )
                elements.append(Paragraph(date_range, date_style))
            
            # Financial data table
            if 'income' in report_data and 'expenses' in report_data:
                # Income Statement
                table_data = [
                    ['Category', 'Amount'],
                    ['', ''],  # Spacer
                    ['Revenue', f"${report_data['income']:,.2f}"],
                    ['', ''],  # Spacer
                    ['Expenses', f"${report_data['expenses']:,.2f}"],
                ]
                
                # Add expense breakdown if available
                if 'expense_breakdown' in report_data:
                    for category, amount in report_data['expense_breakdown'].items():
                        table_data.append([f"  - {category}", f"${amount:,.2f}"])
                
                table_data.extend([
                    ['', ''],  # Spacer
                    ['Net Income', f"${report_data.get('net', report_data['income'] - report_data['expenses']):,.2f}"]
                ])
                
                # Create table
                table = Table(table_data, colWidths=[4 * inch, 2 * inch])
                table.setStyle(TableStyle([
                    # Header
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 12),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    
                    # Data cells
                    ('FONTNAME', (0, 2), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 2), (-1, -1), 10),
                    ('ALIGN', (1, 2), (1, -1), 'RIGHT'),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                    
                    # Total row
                    ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#e5e7eb')),
                    ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, -1), (-1, -1), 11),
                ]))
                
                elements.append(table)
            
            # Build PDF
            doc.build(elements, onFirstPage=PDFReportService._create_footer, onLaterPages=PDFReportService._create_footer)
            
            # Get PDF bytes
            pdf_bytes = buffer.getvalue()
            buffer.close()
            
            logger.info(f"Generated {report_type} PDF report for {company_name}")
            return pdf_bytes
            
        except Exception as e:
            logger.error(f"Failed to generate PDF report: {e}")
            raise Exception(f"PDF generation failed: {str(e)}")
    
    @staticmethod
    def generate_payroll_report(
        company_name: str,
        payroll_data: List[Dict[str, Any]],
        period_start: str,
        period_end: str
    ) -> bytes:
        """Generate a payroll summary report PDF.
        
        Args:
            company_name: Name of the company
            payroll_data: List of payroll item dictionaries
            period_start: Start date of payroll period
            period_end: End date of payroll period
            
        Returns:
            PDF as bytes
        """
        try:
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
            elements = []
            
            # Add header
            elements.extend(PDFReportService._create_header(company_name, "Payroll Report"))
            
            # Period
            styles = getSampleStyleSheet()
            period_text = f"Period: {period_start} to {period_end}"
            elements.append(Paragraph(period_text, styles['Normal']))
            elements.append(Spacer(1, 0.3 * inch))
            
            # Payroll table
            table_data = [['Employee', 'Gross Pay', 'Deductions', 'Net Pay']]
            
            total_gross = 0
            total_deductions = 0
            total_net = 0
            
            for item in payroll_data:
                table_data.append([
                    item['employee_name'],
                    f"${item['gross_pay']:,.2f}",
                    f"${item['deductions']:,.2f}",
                    f"${item['net_pay']:,.2f}"
                ])
                total_gross += item['gross_pay']
                total_deductions += item['deductions']
                total_net += item['net_pay']
            
            # Totals row
            table_data.append([
                'TOTAL',
                f"${total_gross:,.2f}",
                f"${total_deductions:,.2f}",
                f"${total_net:,.2f}"
            ])
            
            table = Table(table_data, colWidths=[2.5 * inch, 1.5 * inch, 1.5 * inch, 1.5 * inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('FONTNAME', (0, 1), (-1, -2), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -2), 9),
                ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
                ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#e5e7eb')),
                ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ]))
            
            elements.append(table)
            
            doc.build(elements, onFirstPage=PDFReportService._create_footer, onLaterPages=PDFReportService._create_footer)
            
            pdf_bytes = buffer.getvalue()
            buffer.close()
            
            logger.info(f"Generated payroll PDF report for {company_name}")
            return pdf_bytes
            
        except Exception as e:
            logger.error(f"Failed to generate payroll PDF: {e}")
            raise Exception(f"PDF generation failed: {str(e)}")


# Singleton instance
pdf_service = PDFReportService()
