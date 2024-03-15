import React, { PureComponent } from "react";
import { BarChart, Bar, Rectangle, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { api } from "~/utils/api";

interface BarGraphProps {
  type: string;
}

const BarGraph: React.FC<BarGraphProps> = ({ type }) => {
  if (type === "clinicsVisited") {
    const activePets = api.petClinic.getClinicVisitsBySpecies.useQuery();
    const visits_data = activePets?.data?.data;
    const response = activePets?.data?.visits ?? { dogs: {}, cats: {} };

    // const transformedData = Object.entries(response).map(([category, value]) => ({
    //   category: String(category),
    //   value: value,
    // }));

    console.log("Visits!!!: ", visits_data);

    console.log("dogs!!: ", response.dogs, "cats!!: ", response.cats);

    const years = [...new Set([...Object.keys(response.dogs), ...Object.keys(response.cats)])];

    const data = years.map((year) => ({
      name: `${year}`,
      Dogs: response.dogs[Number(year)]!,
      Cats: response.cats[Number(year)]! || 0,
      amt: response.dogs[Number(year)]! + response.cats[Number(year)]! || 0,
    }));

    if (activePets.isLoading) {
      return (
        <div className="flex items-center justify-center pl-16">
          <div
            className="mx-2 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-current border-main-orange border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
            role="status"
          />
        </div>
      );
    }

    return (
      <ResponsiveContainer width="90%" height="80%">
        <BarChart
          width={500}
          height={300}
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Dogs" fill="#EB4724" activeBar={<Rectangle fill="orange" stroke="black" />} />
          <Bar dataKey="Cats" fill="#D1D5DB" activeBar={<Rectangle fill="gray" stroke="black" />} />
        </BarChart>
        {/* <h2 style={{ textAlign: "center" }}>Active Pets</h2> */}
      </ResponsiveContainer>

      //   <ResponsiveContainer width="90%" height="80%">
      //     <BarChart
      //       width={500}
      //       height={300}
      //       data={data}
      //       margin={{
      //         top: 5,
      //         right: 30,
      //         left: 20,
      //         bottom: 5,
      //       }}
      //     >
      //       <CartesianGrid strokeDasharray="3 3" />
      //       <XAxis dataKey="name" />
      //       <YAxis />
      //       <Tooltip />
      //       <Legend />
      //       <Bar dataKey="Dogs" fill="#EB4724" activeBar={<Rectangle fill="orange" stroke="black" />} />
      //       <Bar dataKey="Cats" fill="#D1D5DB" activeBar={<Rectangle fill="gray" stroke="black" />} />
      //     </BarChart>
      //   </ResponsiveContainer>
    );
  } else if (type === "sterilisedPets") {
    const sterilisedPets = api.pet.getSterilisedPets.useQuery();
    const response = sterilisedPets?.data ?? { dogs: {}, cats: {} };

    // const transformedData = Object.entries(response).map(([category, value]) => ({
    //   category: String(category),
    //   value: value,
    // }));

    console.log("dogs: ", response.dogs, "cats: ", response.cats);

    const years = [...new Set([...Object.keys(response.dogs), ...Object.keys(response.cats)])];

    const data = years.map((year) => ({
      name: `${year}`,
      Dogs: response.dogs[Number(year)]!,
      Cats: response.cats[Number(year)]! || 0,
      amt: response.dogs[Number(year)]! + response.cats[Number(year)]! || 0,
    }));

    if (sterilisedPets.isLoading) {
      return (
        <div className="flex items-center justify-center pl-16">
          <div
            className="mx-2 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-current border-main-orange border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
            role="status"
          />
        </div>
      );
    }

    return (
      <ResponsiveContainer width="90%" height="80%">
        <BarChart
          width={500}
          height={300}
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Dogs" fill="#EB4724" activeBar={<Rectangle fill="orange" stroke="black" />} />
          <Bar dataKey="Cats" fill="#D1D5DB" activeBar={<Rectangle fill="gray" stroke="black" />} />
        </BarChart>
      </ResponsiveContainer>
    );
  }
};

/*
const data = [
  {
    name: 'Page A',
    uv: 4000,
    pv: 2400,
    amt: 2400,
  },
  {
    name: 'Page B',
    uv: 3000,
    pv: 1398,
    amt: 2210,
  },
  {
    name: 'Page C',
    uv: 2000,
    pv: 9800,
    amt: 2290,
  },
  {
    name: 'Page D',
    uv: 2780,
    pv: 3908,
    amt: 2000,
  },
  {
    name: 'Page E',
    uv: 1890,
    pv: 4800,
    amt: 2181,
  },
  {
    name: 'Page F',
    uv: 2390,
    pv: 3800,
    amt: 2500,
  },
  {
    name: 'Page G',
    uv: 3490,
    pv: 4300,
    amt: 2100,
  },
];

export default class Example extends PureComponent {
  static demoUrl = 'https://codesandbox.io/s/simple-bar-chart-tpz8r';

  render() {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          width={500}
          height={300}
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="pv" fill="#8884d8" activeBar={<Rectangle fill="pink" stroke="blue" />} />
          <Bar dataKey="uv" fill="#82ca9d" activeBar={<Rectangle fill="gold" stroke="purple" />} />
        </BarChart>
      </ResponsiveContainer>
    );
  }
}*/

export default BarGraph;
