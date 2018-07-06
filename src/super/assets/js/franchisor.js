function searchMyOrder(){
  var tr=[];
  dt1=$('#start').val();
  dt2=$('#end').val();
  dt=[dt1,dt2]
  if(!dt1 || !dt2){
    showMSG('Please enter daterage', 'warning');
    return;
  }
  clnt=['Mombasa', 'Ronald'];
  prod=['Coffe Mug', 'School Bag', 'Water Bottle'];
  add=['Eastleigh Second Ave, Nairobi, Kenya',

'Shariff Guest House, Eastleigh Second Ave, Nairobi City, Kenya',

'Off 2nd Avenue, Eastleigh, Tenth St, Nairobi, Kenya',

'Next To Sky Blue Lodge, Eastleigh Second Avenue, Nairobi, Kenya ']
  for(var i=0; i<5; i++){
    tr.push('<tr><td>');
    tr.push('ORD'+getRandomInt(15648));
    tr.push('</td><td>');
    tr.push(getRandomInt(558899))
    tr.push('</td><td>');
    tr.push(dt[getRandomInt(2)])
    tr.push('</td><td>');
    tr.push(prod[getRandomInt(3)])
    tr.push('</td><td>');
    tr.push(getRandomInt(24))
    tr.push('</td><td>');
    tr.push(clnt[getRandomInt(2)])
    tr.push('</td><td>');
    tr.push(add[getRandomInt(4)])
    tr.push('</td></tr>');
    
  }
  $('#table_body').html(tr.join(''));
}

function addProductToFrechise(id){
  var tds = $('#'+id).children(); 
  var reatilPrice = tds.eq(7).children()[0].value;
  if(!reatilPrice) {
    showMSG('Please enter retail price', 'warning');
    return;
  }
  
  var row = $("<tr></tr>");
  row.append(tds.eq(0).clone())
  .append(tds.eq(1).clone())
  .append(tds.eq(2).clone())
  .append(tds.eq(3).clone())
  .append(tds.eq(4).clone())
  .append(tds.eq(5).clone())
  .append(tds.eq(6).clone())
  .append('<td>'+reatilPrice+'</td>')
  .appendTo($('#frenchise_product'));
  $('#'+id).remove();
}
