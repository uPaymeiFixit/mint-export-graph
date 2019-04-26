let data;
let date_to_index;

window.onload = () => {
  document.getElementById('input-file').addEventListener('change', getFile);
}

function getFile(event) {
	const input = event.target
  if ('files' in input && input.files.length > 0) {
	  readCSV(input.files[0])
  }
}

function readFileContent(file) {
	const reader = new FileReader()
  return new Promise((resolve, reject) => {
    reader.onload = event => resolve(event.target.result)
    reader.onerror = error => reject(error)
    reader.readAsText(file);
  })
}

function readCSV(file) {
	readFileContent(file).then(content => {
  	const csv = CSVToArray(content);
    data = parseData(csv);
    const graph_points = formatData(data);
    drawGraph(graph_points);
  }).catch(error => console.log(error))
}

// Parse CSV into array of objects
function parseData(csv) {
  let data = [];
  for (let i = 1; i < csv.length; i++) {
    if (csv[i][3] !== undefined) {
      data.push({
        date: new Date(csv[i][0]),
        description: csv[i][1],
        original_description: csv[i][2],
        amount: csv[i][3] * (csv[i][4] === 'debit' ? -1 : 1),
        category: csv[i][5],
        account_name: csv[i][6],
        labels: csv[i][7],
        notes: csv[i][8]
      });
    }
  }
  return data;
}


function formatData(data) {
  // Make an array of stacked data, for example
  // Array[n] = Array[n] + Array[n - 1]
  let stacked_amount = [];
  stacked_amount[data.length - 1] = data[data.length - 1].amount;
  for (let i = data.length - 2; i >= 0; --i) {
    stacked_amount[i] = data[i].amount + stacked_amount[i + 1];
  }


  const date_from = new Date(document.getElementById('date-from').value);
  let date_from_index = data.length - 1;
  for (let i = 0; i < data.length; i++) {
    if (data[i].date < date_from) {
      date_from_index = i - 1;
      break;
    }
  }

  const date_to = new Date(document.getElementById('date-to').value);
  date_to_index = 0;
  for (let i = data.length - 1; i >= 0; --i) {
    if (i < 100) {
      console.log(`if (${data[i].date} > ${date_to})`);
    }
    if (data[i].date > date_to) {
      date_to_index = i - 1;
      break;
    }
  }

  let formatted_data = [];
  for (let i = date_to_index; i <= date_from_index; i++) {
    formatted_data.push({
      t: data[i].date, 
      y: stacked_amount[i]
    });
  }

  return formatted_data;
}

function tooltipLabel(tooltipItem) {
  let amount = data[tooltipItem.index + date_to_index].amount;
  amount = amount < 0 ? `-$${-amount}` : `$${amount}`;
  return `${amount}\n${data[tooltipItem.index + date_to_index].description}`;
}

function tooltipColor(tooltipItem) {
  let amount = data[tooltipItem.index + date_to_index].amount;
  let color = amount < 0 ? 'rgb(255, 0, 0)' : 'rgb(0, 255, 0)';
  return {
    borderColor: color,
    backgroundColor: color
  }
}

function tooltipTitle(tooltipItem) {
  return data[tooltipItem[0].index + date_to_index].date.toLocaleDateString('en-US');
}

// Configure and draw Chart.js
function drawGraph(graph_points) {
  new Chart('myChart', {
    type: 'line',
    data: {
      datasets: [{
        backgroundColor: '#00ff00',
        borderColor: '#ff00cc',
        borderWidth: 2,
        fill: false,
        data: graph_points
      }]
    } ,
    options: {
      tooltips: {
        callbacks: {
          label: tooltipLabel,
          labelColor: tooltipColor,
          title: tooltipTitle
        }
      },
      legend: {
        display: false
      },
      elements: {
        line: {
          tension: 0
        }
      },
      maintainAspectRatio: false,
      scales: {
        xAxes: [{
          type: 'time',
          display: false,
        }],
        yAxes: [{
          display: false,
        }]
      }
    }
  });
}
