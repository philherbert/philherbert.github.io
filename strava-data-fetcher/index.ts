import strava, { DetailedActivityResponse } from 'strava-v3';
import * as fs from "fs";

strava.client("fake");

// from https://en.wikipedia.org/wiki/Module:Location_map/data/USA_New_York_City
const NYC_LAT_MAX = 40.92
const NYC_LAT_MIN = 40.49
const NYC_LNG_MAX = -73.68
const NYC_LNG_MIN = -74.27

const hasLocationData = (activity: DetailedActivityResponse): boolean => {
  // @ts-ignore
  return activity['start_latlng'] && activity['end_latlng']
}

const isWithinNyc = (lat: number, lng: number) => {
  return (NYC_LAT_MIN < lat) && (lat < NYC_LAT_MAX) && (NYC_LNG_MIN < lng) && (lng < NYC_LNG_MAX)
}

const startsOrEndsWithinNyc = (activity: DetailedActivityResponse): boolean => {
  // @ts-ignore
  const [start_lat, start_lng] = activity['start_latlng']
  // @ts-ignore
  const [end_lat, end_lng] = activity['end_latlng']

  return isWithinNyc(start_lat, start_lng) || isWithinNyc(end_lat, end_lng)
}

type Run = {
  id: string;
  polyline: string;
}

type RunFile = {
  runs: Run[];
  lastUpdatedEpochSeconds: number;
}

const getPolyline = async (id: string): Promise<string> => {
  console.log(`fetching polyline for activity ${id}`);
  const activity = await strava.activities.get({id})
  return activity.map!.polyline
}

const getPayload = async () => {

  // let lastUpdatedEpochSeconds;

  let existingRuns: Run[] = [];

  fs.readFile('data.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    const dataJson = JSON.parse(data);
    existingRuns = dataJson['runs']
    // lastUpdatedEpochSeconds = dataJson['lastUpdatedEpochSeconds']
  });

  const epoch20200101 = 1580515200
  const epoch20210101 = 1612137600
  const epoch20220101 = 1643673600
  const epoch20230101 = 1675209600
  const epoch20240101 = 1675209600


  const payload = await strava.athlete.listActivities({per_page: '200', after: epoch20230101 })

  const newLastUpdatedEpochSeconds = Math.round(Date.now() / 1000)
  const runsJson: RunFile = {
    runs: existingRuns,
    lastUpdatedEpochSeconds: newLastUpdatedEpochSeconds
  }

  const newRuns = await Promise.all(
    payload
      .filter((activity: DetailedActivityResponse) => {
        return activity.sport_type === 'Run' && hasLocationData(activity) && startsOrEndsWithinNyc(activity)
      })
      .map(async (activity: DetailedActivityResponse) => {
        const polyline = await getPolyline(activity.id)
        return {id: activity.id, polyline}
      })
  )

  runsJson.runs = runsJson.runs.concat(newRuns)

  const data = JSON.stringify(runsJson);

  fs.writeFile("data.json", data, (error) => {
    if (error) {
      console.error(error);
      throw error;
    }

    console.log("data.json written correctly");
  });
}

getPayload()
