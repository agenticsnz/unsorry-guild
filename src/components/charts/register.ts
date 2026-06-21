// Register the Chart.js pieces used across the app exactly once (ADR-023).
// Imported by every chart wrapper; registration is idempotent.
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
  Legend,
  Title,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
  Legend,
  Title,
)
