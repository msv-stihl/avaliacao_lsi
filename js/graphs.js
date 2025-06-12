const gaugeElementJD = document.querySelector(".gauge_jar");
const gaugeElementLC = document.querySelector(".gauge_lco");
const gaugeElementLI = document.querySelector(".gauge_lte");
var MES_SELECTED = document.getElementById('mes').value

function setGaugeValue(gauge, value) {
  if (value < 0 || value > 1) {
    return;
  }
  gauge.querySelector(".gauge__fill").style.transform = `rotate(${
    value / 2
  }turn)`;
  gauge.querySelector(".gauge__cover").textContent = `${
    parseFloat(value * 100).toFixed(1)
  }%`;
}

function getDataLI() {
  fetch("https://api.apispreadsheets.com/data/TBYz0elh6Dg1jVir/").then( res => {
      return res.json()
    }).then(data => {
      calculateLI(data.data)
    })
}

function getDataJD() {
  fetch("https://api.apispreadsheets.com/data/W9CDGKNkP4EJzYao/").then( res => {
      return res.json()
    }).then(data => {
      calculateJD(data.data)
    })
}

function getDataLC() {
  fetch("https://api.apispreadsheets.com/data/Qq7S4OsWTtSQdfEa/").then( res => {
      return res.json()
    }).then(data => {
      calculateLC(data.data)
    })
}

function calculateLI(data) {
  var media = 0;
  var qtd = 0;
  data.forEach((row) => {
    if(row.mes == MES_SELECTED && row.eficacia < 2){
      media += row.eficacia
      qtd++
    }
  })
  media = media / qtd
  setGaugeValue(gaugeElementLI, media)
}

function calculateJD(data) {
  var media = 0;
  var qtd = 0;
  data.forEach((row) => {
    if(row.mes == MES_SELECTED){
      media += row.eficacia
      qtd++
    }
  })
  media = media / qtd
  setGaugeValue(gaugeElementJD, media)
}

function calculateLC(data) {
  var media = 0;
  var qtd = 0;
  data.forEach((row) => {
    if(row.mes == MES_SELECTED){
      media += row.eficacia
      qtd++
    }
  })
  media = media / qtd
  setGaugeValue(gaugeElementLC, media)
}

getDataLI()
getDataJD()
getDataLC()

function updateGraphs() {
  MES_SELECTED = document.getElementById('mes').value
  getDataLI()
  getDataJD()
  getDataLC()
}
