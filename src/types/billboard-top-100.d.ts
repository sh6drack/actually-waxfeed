declare module "billboard-top-100" {
  interface ChartSong {
    rank: number
    title: string
    artist: string
    cover: string
    position: {
      positionLastWeek: number
      peakPosition: number
      weeksOnChart: number
    }
  }

  interface Chart {
    songs: ChartSong[]
    week: string
  }

  export function getChart(
    chartName: string,
    callback: (err: Error | null, chart: Chart) => void
  ): void

  export function getChart(
    chartName: string,
    date: string,
    callback: (err: Error | null, chart: Chart) => void
  ): void

  export function listCharts(
    callback: (err: Error | null, charts: string[]) => void
  ): void
}
