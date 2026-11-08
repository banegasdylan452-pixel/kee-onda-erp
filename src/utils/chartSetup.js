import { Chart as ChartJS, registerables } from 'chart.js';

// Register all Chart.js controllers (line, bar, doughnut, pie, etc.), scales, elements and plugins
ChartJS.register(...registerables);

export default ChartJS;


