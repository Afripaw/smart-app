// import React, { PureComponent } from "react";
// import { type NextPage } from "next";
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
// import { api } from "~/utils/api";

// const series = [
//   {
//     name: "Active Owners",
//     data: [
//       { category: "A", value: Math.random() },
//       { category: "B", value: Math.random() },
//       { category: "C", value: Math.random() },
//       { category: "D", value: Math.random() },
//       { category: "E", value: Math.random() },
//       { category: "F", value: Math.random() },
//     ],
//   },
// ];

// class LineGraph extends PureComponent {

// //   activeOwners = api.petOwner.getActiveOwners.useQuery();

// //   series = activeOwners
// //     ? [
// //         {
// //           name: "Active Owners",
// //           data: Object.entries(activeOwners).map(([category, value]) => ({
// //             category: String(category),
// //             value: value as number,
// //           })),
// //         },
// //       ]
// //     : [{ name: "Active Owners", data: [] }];

//   render() {
//     return (
//       <ResponsiveContainer width="80%" height="80%">
//         <LineChart width={500} height={300}>
//           <CartesianGrid strokeDasharray="3 3" />
//           <XAxis dataKey="category" type="category" allowDuplicatedCategory={false} />
//           <YAxis dataKey="value" />
//           <Tooltip />
//           <Legend />
//           {series.map((s) => (
//             <Line dataKey="value" data={s.data} name={s.name} key={s.name} />
//           ))}
//         </LineChart>
//       </ResponsiveContainer>
//     );
//   }
// }

// export default LineGraph;

//

import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { api } from "~/utils/api";

interface LineGraphProps {
  type: string;
}

const LineGraph: React.FC<LineGraphProps> = ({ type }) => {
  if (type === "activeOwners") {
    const activeOwners = api.petOwner.getActiveOwners?.useQuery();
    const response = activeOwners?.data ?? [];
    const transformedData = Object.entries(response).map(([category, value]) => ({
      category: String(category),
      value: value,
    }));

    if (activeOwners.isLoading) {
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
      <ResponsiveContainer width="80%" height="80%">
        <LineChart width={500} height={300} data={transformedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="value" name="Active Pet Owners" stroke="#EB4724" />
        </LineChart>
      </ResponsiveContainer>
    );
  } else if (type === "activeVolunteers") {
    const activeVolunteers = api.volunteer.getActiveVolunteersFor5Years.useQuery();
    const response = activeVolunteers?.data ?? [];
    const transformedData = Object.entries(response).map(([category, value]) => ({
      category: String(category),
      value: value,
    }));

    if (activeVolunteers.isLoading) {
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
      <ResponsiveContainer width="80%" height="80%">
        <LineChart width={500} height={300} data={transformedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="value" name="Active Volunteers" stroke="#EB4724" />
        </LineChart>
      </ResponsiveContainer>
    );
  } else if (type === "kennels") {
    const kennels = api.pet.getKennelsProvided.useQuery();
    const response = kennels?.data ?? [];
    const transformedData = Object.entries(response).map(([category, value]) => ({
      category: String(category),
      value: value,
    }));

    if (kennels.isLoading) {
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
      <ResponsiveContainer width="80%" height="80%">
        <LineChart width={500} height={300} data={transformedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="value" name="Kennels Provided" stroke="#EB4724" />
        </LineChart>
      </ResponsiveContainer>
    );
  } else if (type === "clinics") {
    const clinics = api.petClinic.getClinicsHeld.useQuery();
    const response = clinics?.data ?? [];
    const transformedData = Object.entries(response).map(([category, value]) => ({
      category: String(category),
      value: value,
    }));

    if (clinics.isLoading) {
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
      <ResponsiveContainer width="80%" height="80%">
        <LineChart width={500} height={300} data={transformedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="value" name="Pet Clinics Held" stroke="#EB4724" />
        </LineChart>
      </ResponsiveContainer>
    );
  }
};
//   const [data, setData] = useState([{ name: "Active Owners", data: [{ category: "A", value: 0 }] }]);
//   const activeOwners = api.petOwner.getActiveOwners.useQuery();
//   const response = activeOwners?.data ?? [];

//   // Assuming `useQuery` is an async operation to fetch data
//   const fetchData = async () => {
//     try {
//       // Transform the response into a format suitable for the chart
//       const transformedData = Object.entries(response).map(([category, value]) => ({
//         category: String(category),
//         value: value,
//       }));
//       setData([
//         {
//           name: "Active Owners",
//           data: transformedData,
//         },
//       ]);
//     } catch (error) {
//       console.error("Failed to fetch data:", error);
//     }
//   };

//   useEffect(() => {
//     void fetchData();
//   }, []);

//   return (
//     <ResponsiveContainer width="80%" height="80%">
//       <LineChart width={500} height={300} data={data}>
//         <CartesianGrid strokeDasharray="3 3" />
//         <XAxis dataKey="category" />
//         <YAxis />
//         <Tooltip />
//         <Legend />
//         {data.map((series, index) => (
//           <Line key={index} type="monotone" dataKey="value" data={series.data} name={series.name} stroke="#8884d8" />
//         ))}
//       </LineChart>
//     </ResponsiveContainer>
//   );
// };

export default LineGraph;
