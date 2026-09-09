if(!isTour){
 const reportButton=document.createElement('button');reportButton.id='downloadReport';reportButton.className='primary';reportButton.textContent='Download report (HTML)';$('export').before(reportButton);$('export').textContent='Download evidence (JSON)';$('export').classList.remove('primary');
 reportButton.onclick=safe(()=>{download('EE4002_Lab1_Report.html',LabReport.build(collectLabEvidence()),'text/html;charset=utf-8');message('Report download requested. Open EE4002_Lab1_Report.html to review or print to PDF. Download the JSON evidence too, then upload both files to Moodle yourself.');});
}
