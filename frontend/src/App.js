import axios from "axios";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

const api = axios.create({
  baseURL: "http://localhost:5000",
});

const FieldArrayItem = ({
  field,
  index,
  products,
  countries,
  register,
  remove,
  unregister,
}) => {
  const [useCoords, setUseCoords] = useState(false);

  useEffect(() => {
    if (useCoords) {
      unregister(`payload.${index}.country`);
    } else {
      unregister(`payload.${index}.latitude`);
      unregister(`payload.${index}.longitude`);
    }
  }, [index, unregister, useCoords]);

  return (
    <div className="grid grid-cols-5 gap-4 col-span-5">
      <div className="flex flex-col">
        {useCoords ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="font-bold text-sm">Longitude</label>

              <input
                required
                className="border rounded-lg p-2 font-bold"
                {...register(`payload.${index}.longitude`)}
              />
            </div>
            <div className="flex flex-col">
              <label className="font-bold text-sm">Latitude</label>

              <input
                required
                className="border rounded-lg p-2 font-bold"
                {...register(`payload.${index}.latitude`)}
              />
            </div>
          </div>
        ) : (
          <>
            <label className="font-bold text-sm">Location</label>

            <select
              required
              className="border rounded-lg p-2 font-bold"
              {...register(`payload.${index}.country`)}
            >
              {countries.map((country) => (
                <option key={country.value} value={country.value}>
                  {country.label}
                </option>
              ))}
            </select>
          </>
        )}
        <div className="flex items-center mt-1">
          <input
            type="checkbox"
            className="mr-1"
            id={`${field.id}-usecoords`}
            onChange={({ target: { checked } }) => setUseCoords(checked)}
            checked={useCoords}
          />
          <label
            className="text-sm font-light"
            htmlFor={`${field.id}-usecoords`}
          >
            Use coordinates
          </label>
        </div>
      </div>
      <div className="flex flex-col">
        <label className="font-bold text-sm">Emission</label>

        <select
          required
          className="border rounded-lg p-2 font-bold capitalize"
          {...register(`payload.${index}.product`)}
        >
          {products.map((product) => (
            <option key={product.product_variable} value={product.name}>
              {product.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col">
        <label className="font-bold text-sm">Start Date</label>

        <input
          required
          className="border rounded-lg p-2 font-bold"
          {...register(`payload.${index}.begin`)}
          type="date"
        />
      </div>
      <div className="flex flex-col">
        <label className="font-bold text-sm">End Date</label>

        <input
          required
          className="border rounded-lg p-2 font-bold"
          {...register(`payload.${index}.end`)}
          type="date"
        />
      </div>
      {index !== 0 && (
        <button
          type="button"
          onClick={() => remove(index)}
          className="px-8 py-2 bg-red-300 hover:bg-red-800 transition-colors text-red-800 hover:text-red-300 rounded-lg shadow-md  shadow-red-100 font-bold self-center"
        >
          Delete
        </button>
      )}
    </div>
  );
};

const App = () => {
  const [countries, setCountries] = useState([]);
  const [products, setProducts] = useState([]);
  const [initiated, setInitiated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [averages, setAverages] = useState({
    average: 0,
    total: 0,
    details: [],
  });

  useEffect(() => {
    (async () => {
      try {
        const [{ data: countriesData }, { data: productsData }] =
          await Promise.all([api.get("/countries"), api.get("/emissions")]);
        setCountries(countriesData);
        setProducts(productsData);
        setInitiated(true);
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  const { control, register, handleSubmit, unregister } = useForm();
  const { fields, append, remove } = useFieldArray({
    name: "payload",
    control: control,
  });

  useEffect(() => {
    if (!fields.length) append();
  }, [append, fields.length]);

  const handleFormSubmit = async ({ payload }) => {
    try {
      setLoading(true);
      const { data } = await api.post("/average", payload);
      setAverages(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!initiated)
    return (
      <div className="min-h-screen grid place-items-center">
        <span className="text-3xl font-bold">Loading ...</span>
      </div>
    );

  return (
    <div className="container mx-auto py-12">
      <form
        className="grid gap-3 grid-cols-5"
        onSubmit={handleSubmit(handleFormSubmit)}
      >
        {fields.map((field, index) => (
          <FieldArrayItem
            field={field}
            index={index}
            register={register}
            countries={countries}
            products={products}
            key={field.id}
            remove={remove}
            unregister={unregister}
          />
        ))}
        <button
          type="button"
          onClick={() => append()}
          className="px-8 py-2 bg-emerald-300 hover:bg-emerald-800 transition-colors text-emerald-800 hover:text-emerald-300 rounded-lg shadow-md  shadow-emerald-100 font-bold col-start-5"
        >
          Add Location
        </button>
        <button
          disabled={loading}
          type="submit"
          className="px-8 py-2 bg-cyan-300 hover:bg-cyan-800 transition-colors text-cyan-800 hover:text-cyan-300 rounded-lg shadow-md  shadow-cyan-100 font-bold col-start-5 mt-20 disabled:opacity-50 disabled:cursor-wait"
        >
          Submit
        </button>
      </form>

      {loading ? (
        <span>Loading ...</span>
      ) : (
        <div className="grid gap-2">
          <p>
            <b>Total emissions : </b> {averages.total}
          </p>
          <p>
            <b>Average emissions : </b> {averages.average}
          </p>

          {averages.details.map((average, index) => (
            <p key={index}>
              An average of <b>{average.total}</b> mol/m² for{" "}
              <b>{average.days}</b> days.
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;
