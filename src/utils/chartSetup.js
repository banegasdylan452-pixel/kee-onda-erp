import Chart from 'chart.js/auto';
import { registerables } from 'chart.js';

// Explicitly register all Chart.js controllers (line, bar, doughnut, pie, etc.)
if (registerables) {
  Chart.register(...registerables);
}

export default Chart;



