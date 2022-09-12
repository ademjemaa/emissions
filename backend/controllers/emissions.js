import axios from "axios";
import { addDays, differenceInDays, format } from "date-fns";

const api = axios.create({
  baseURL: "https://api.v2.emissions-api.org/api/v2",
});

export const getEmissions = async (_, res) => {
  try {
    const { data } = await api.get(`/products.json`);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const getCountries = async (_, res) => {
  try {
    const { data } = await api.get(`/countries.json`);
    const payload = Object.entries(data)
      .map(([key, value]) => ({
        label: value,
        value: key,
      }))
      .sort(
        (a, b) =>
          a.label.toLowerCase().charCodeAt(0) -
          b.label.toLowerCase().charCodeAt(0)
      );

    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const getAverage = async (req, res) => {
  try {
    const { product, trips } = req.body;
    if (!trips instanceof Array) throw new Error("Invalid request body");
    let tripTotal = 0;
    let tripDays = 0;
    const details = await Promise.all(
      trips.map(async ({ country, begin, end, longitude, latitude }) => {
        const params = new URLSearchParams({
          begin,
          end,
        });

        if (country) {
          params.append("country", country);
        } else {
          params.append("point", longitude);
          params.append("point", latitude);
        }

        const { data } = await api.get(`/${product}/average.json`, {
          params,
        });

        const days = Math.abs(differenceInDays(new Date(end), new Date(begin)));

        if (!data.length)
          return {
            total: 0,
            days: 0,
          };

        const formattedData = data
          .sort((a, b) => new Date(a.start) - new Date(b.start))
          .reduce((prev, cur) => {
            prev[format(new Date(cur.start), "yyyy-MM-dd")] = cur.average;
            return prev;
          }, {});

        tripDays += days;

        let selectedFormattedDataKey = Object.keys(formattedData)[0];

        const generatedData = new Array(days).fill(null).map((_, i) => {
          const formattedDate = format(
            addDays(new Date(begin), i),
            "yyyy-MM-dd"
          );

          if (formattedData[formattedDate]) {
            selectedFormattedDataKey = formattedDate;
          }

          return {
            date: formattedDate,
            average: formattedData[selectedFormattedDataKey],
          };
        });

        const total = generatedData.reduce((prev, cur) => {
          return prev + cur.average;
        }, 0);

        tripTotal += total;

        return {
          total: total / days,
          days,
        };
      })
    );

    const response = {
      total: tripTotal,
      average: tripTotal / (tripDays || 1),
      details,
    };

    res.status(200).json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};