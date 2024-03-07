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
    const response = activeOwners?.data?.transformedData ?? [];

    const colours = ["#EB4724", "#1111DD", "11DD11", "#D1D5DB"];

    console.log("owners: ", activeOwners?.data?.owners ?? []);

    // Assuming all items in the response have the same structure,
    // we can take the keys from the first item's value object.
    const areaKeys = response.length > 0 ? Object.keys(response[0]?.value ?? "") : [];

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

    console.log(response, areaKeys);

    return (
      <ResponsiveContainer width="80%" height="80%">
        <LineChart width={500} height={300} data={response}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" padding={{ left: 30, right: 30 }} />
          <YAxis />
          <Tooltip />
          <Legend />
          {areaKeys.map((key, index) => (
            <Line type="monotone" dataKey={`value.${key}`} stroke={colours[index]} name={key} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  } else if (type === "activeVolunteers") {
    const activeVolunteers = api.volunteer.getActiveVolunteersFor5Years?.useQuery();
    const response = activeVolunteers?.data?.transformedData ?? [];

    const colours = ["#EB4724", "#1111DD", "11DD11", "#D1D5DB"];

    console.log("volunteers: ", activeVolunteers?.data?.owners ?? []);

    // Assuming all items in the response have the same structure,
    // we can take the keys from the first item's value object.
    const areaKeys = response.length > 0 ? Object.keys(response[0]?.value ?? "") : [];

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

    console.log(response, areaKeys);

    return (
      <ResponsiveContainer width="80%" height="80%">
        <LineChart width={500} height={300} data={response}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" padding={{ left: 30, right: 30 }} />
          <YAxis />
          <Tooltip />
          <Legend />
          {areaKeys.map((key, index) => (
            <Line type="monotone" dataKey={`value.${key}`} stroke={colours[index]} name={key} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
    // const activeVolunteers = api.volunteer.getActiveVolunteersFor5Years.useQuery();
    // const response = activeVolunteers?.data ?? [];
    // const transformedData = Object.entries(response).map(([category, value]) => ({
    //   category: String(category),
    //   value: value,
    // }));

    // if (activeVolunteers.isLoading) {
    //   return (
    //     <div className="flex items-center justify-center pl-16">
    //       <div
    //         className="mx-2 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-current border-main-orange border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
    //         role="status"
    //       />
    //     </div>
    //   );
    // }
    // return (
    //   <ResponsiveContainer width="80%" height="80%">
    //     <LineChart width={500} height={300} data={transformedData}>
    //       <CartesianGrid strokeDasharray="3 3" />
    //       <XAxis dataKey="category" />
    //       <YAxis />
    //       <Tooltip />
    //       <Legend />
    //       <Line type="monotone" dataKey="value" name="Flagship" stroke="#EB4724" />
    //     </LineChart>
    //   </ResponsiveContainer>
    // );
  } else if (type === "kennels") {
    const kennelsProvided = api.pet.getKennels?.useQuery();
    const response = kennelsProvided?.data?.transformedData ?? [];

    const colours = ["#EB4724", "#1111DD", "11DD11", "#D1D5DB"];

    console.log("kennels: ", kennelsProvided?.data?.kennels ?? []);
    console.log("kennel years", kennelsProvided?.data?.kennelYears ?? []);

    // Assuming all items in the response have the same structure,
    // we can take the keys from the first item's value object.
    const areaKeys = response.length > 0 ? Object.keys(response[0]?.value ?? "") : [];

    if (kennelsProvided.isLoading) {
      return (
        <div className="flex items-center justify-center pl-16">
          <div
            className="mx-2 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-current border-main-orange border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
            role="status"
          />
        </div>
      );
    }

    console.log(response, areaKeys);

    return (
      <ResponsiveContainer width="80%" height="80%">
        <LineChart width={500} height={300} data={response}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" padding={{ left: 30, right: 30 }} />
          <YAxis />
          <Tooltip />
          <Legend />
          {areaKeys.map((key, index) => (
            <Line type="monotone" dataKey={`value.${key}`} stroke={colours[index]} name={key} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  } else if (type === "clinics") {
    const clinicsHeld = api.petClinic.getClinicsHeld?.useQuery();
    const response = clinicsHeld?.data?.transformedData ?? [];

    const colours = ["#EB4724", "#1111DD", "11DD11", "#D1D5DB"];

    console.log("clinics: ", clinicsHeld?.data?.clinics ?? []);
    //console.log("kennel years", kennelsProvided?.data?.kennelYears ?? []);

    // Assuming all items in the response have the same structure,
    // we can take the keys from the first item's value object.
    const areaKeys = response.length > 0 ? Object.keys(response[0]?.value ?? "") : [];

    if (clinicsHeld.isLoading) {
      return (
        <div className="flex items-center justify-center pl-16">
          <div
            className="mx-2 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-current border-main-orange border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
            role="status"
          />
        </div>
      );
    }

    console.log(response, areaKeys);

    return (
      <ResponsiveContainer width="80%" height="80%">
        <LineChart width={500} height={300} data={response}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" padding={{ left: 30, right: 30 }} />
          <YAxis />
          <Tooltip />
          <Legend />
          {areaKeys.map((key, index) => (
            <Line type="monotone" dataKey={`value.${key}`} stroke={colours[index]} name={key} />
          ))}
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
