"use client";

import Image from "next/image";
import axios from "axios";
import { useEffect, useState } from "react";
import Map from "../components/map";

export default function Home() {
  const [intersections, setIntersections] = useState([]);
  const [crashInfo, setCrashInfo] = useState(null);
  const [filterParams, setFilterParams] = useState({year_start: 2011, year_end: 2025, time_start: 0, time_end: 86399});
  const [circleScale, setCircleScale] = useState(1);

  //const res = axios.get('http://localhost:5000/api/intersections');

  async function handleCircleClick(intersectionId, lat, lng, map) {
    try {
      map.panTo({lat, lng});

      const res = await axios.get('http://localhost:5000/api/get_intersection_info', {
        params: {
          id: intersectionId,
          ...filterParams
        }
      });

      setCrashInfo({
        a_street: res.data.a_street,
        b_street: res.data.b_street,
        lat: lat,
        lng: lng,
        num_crashes: res.data.num_crashes,
        total_injuries: res.data.total_injuries,
        injury_rate: res.data.injury_rate,
        deaths: res.data.deaths
      });
    } catch (error) {
      console.error(error);
    }
  }

  function handlePopupClose() {
    setCrashInfo(null);
  }

  async function getIntersectionCrashes() {
    try {
      const res = await axios.get('http://localhost:5000/api/get_all_intersection_crashes', {
        params: filterParams
      });
      setIntersections(res.data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    getIntersectionCrashes();
  }, []);

  function updateYear(is_start, value) {
    if (is_start) {
      filterParams.year_start = value;
    }
    else {
      filterParams.year_end = value;
    }
    getIntersectionCrashes();
  }

  function updateTime(is_start, value) {
    if (is_start) {
      filterParams.time_start = value;
    }
    else {
      filterParams.time_end = value;
    }
    getIntersectionCrashes();
  }

  function secToTime(sec) {
    let date = new Date(0, 0, 0);
    date.setSeconds(sec);
    let hours = date.getHours();
    if (hours < 12) {
      if (hours == 0) {
        hours = 12;
      }
      return `${hours}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")} AM`;
    } else {
      if (hours != 12) {
        hours -= 12;
      }
      return `${hours}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")} PM`;
    }
  }

  function updateVehicle(value) {
    if (value == "") {
      delete filterParams.vehicle;
    }
    else {
      filterParams.vehicle = value;
    }
    getIntersectionCrashes();
  }

  function updateLighting(value) {
    if (value == "") {
      delete filterParams.lighting;
    }
    else {
      filterParams.lighting = value;
    }
    getIntersectionCrashes();
  }

  function updateWeather(value) {
    if (value == "") {
      delete filterParams.weather;
    }
    else {
      filterParams.weather = value;
    }
    getIntersectionCrashes();
  }

  return (
    <div className="mt-5 flex justify-center items-center flex-col gap-4">
      <div>
        <h1 className="font-bold text-4xl">
          San Jose Crash Visualizer
        </h1>
      </div>
      <div className="flex items-center flex-col">
        <p className="font-bold">Circle Scale</p>
        <input type="range" min="0" max="5" step="0.2" defaultValue="1" onChange={(e) => setCircleScale(e.target.value)} />
      </div>
      <div className="flex flex-row w-full">
        <div className="w-1/2">
          <div className="flex items-center flex-col">
            <p className="font-bold">Time</p>
            <div className="flex flex-row gap-2">
              <p>Start</p>
              <input type="range" min="0" max="86399" step="1" defaultValue="0" onChange={(e) => updateTime(true, e.target.value)} />
              <p>{secToTime(filterParams.time_start)}</p>
            </div>
            <div className="flex flex-row gap-2">
              <p>End</p>
              <input type="range" min="0" max="86399" step="1" defaultValue="86399" onChange={(e) => updateTime(false, e.target.value)} />
              <p>{secToTime(filterParams.time_end)}</p>
            </div>
          </div>
        </div>
        <div className="w-1/2">
        <div className="flex items-center flex-col">
            <p className="font-bold">Year</p>
            <div className="flex flex-row gap-2">
              <p>Start</p>
              <input type="range" min="2011" max="2025" step="1" defaultValue="2011" onChange={(e) => updateYear(true, e.target.value)} />
              <p>{filterParams.year_start}</p>
            </div>
            <div className="flex flex-row gap-2">
              <p>End</p>
              <input type="range" min="2011" max="2025" step="1" defaultValue="2025" onChange={(e) => updateYear(false, e.target.value)} />
              <p>{filterParams.year_end}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-row w-full">
        <div className="w-1/3">
          <div className="flex items-center flex-col">
            <p className="font-bold">Involved Vehicle</p>
            <select onChange={(e) => updateVehicle(e.target.value)}>
              <option value=""> No Filter </option>
              <option value="Other Vehicle"> Other Vehicle </option>
              <option value="Parked Vehicle"> Parked Vehicle </option>
              <option value="Bike"> Bike </option>
              <option value="Motorcycle"> Motorcycle </option>
              <option value="Pedestrian"> Pedestrian </option>
            </select>
          </div>
        </div>
        <div className="w-1/3">
          <div className="flex items-center flex-col">
            <p className="font-bold">Lighting</p>
            <select onChange={(e) => updateLighting(e.target.value)}>
              <option value=""> No Filter </option>
              <option value="Daylight"> Daylight </option>
              <option value="Dark - Street Light"> Dark - Street Light </option>
              <option value="Dusk - Dawn"> Dusk - Dawn </option>
            </select>
          </div>
        </div>
        <div className="w-1/3">
        <div className="flex items-center flex-col">
            <p className="font-bold">Weather</p>
            <select onChange={(e) => updateWeather(e.target.value)}>
              <option value=""> No Filter </option>
              <option value="Clear"> Clear </option>
              <option value="Rain"> Rain </option>
              <option value="Cloudy"> Cloudy </option>
            </select>
          </div>
        </div>
      </div>
      <Map className="w-200 h-200" intersections={intersections} onCircleClick={handleCircleClick} info={crashInfo} onPopupClose={handlePopupClose} circleScale={circleScale}/>
    </div>
  );

  /*return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol className="list-inside list-decimal text-sm/6 text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li className="mb-2 tracking-[-.01em]">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-[family-name:var(--font-geist-mono)] font-semibold">
              app/page.js
            </code>
            .
          </li>
          <li className="tracking-[-.01em]">
            Save and see your changes instantly.
          </li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );*/
}