// import React, { PureComponent } from 'react';
// import { PieChart, Pie, Sector, Cell, ResponsiveContainer } from 'recharts';

// const data = [
//   { name: 'Group A', value: 400 },
//   { name: 'Group B', value: 300 },
//   { name: 'Group C', value: 300 },
//   { name: 'Group D', value: 200 },
// ];

// const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// const RADIAN = Math.PI / 180;
// const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
//   const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
//   const x = cx + radius * Math.cos(-midAngle * RADIAN);
//   const y = cy + radius * Math.sin(-midAngle * RADIAN);

//   return (
//     <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
//       {`${(percent * 100).toFixed(0)}%`}
//     </text>
//   );
// };

// export default class Example extends PureComponent {
//   static demoUrl = 'https://codesandbox.io/s/pie-chart-with-customized-label-dlhhj';

//   render() {
//     return (
//       <ResponsiveContainer width="100%" height="100%">
//         <PieChart width={400} height={400}>
//           <Pie
//             data={data}
//             cx="50%"
//             cy="50%"
//             labelLine={false}
//             label={renderCustomizedLabel}
//             outerRadius={80}
//             fill="#8884d8"
//             dataKey="value"
//           >
//             {data.map((entry, index) => (
//               <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//             ))}
//           </Pie>
//         </PieChart>
//       </ResponsiveContainer>
//     );
//   }
// }

import React, { PureComponent } from "react";
import { PieChart, Pie, Sector, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { api } from "~/utils/api";
import { useEffect, useState } from "react";

interface PieGraphProps {
  type: string;
  isLoading?: boolean;
}

const PieGraph: React.FC<PieGraphProps> = ({ type, isLoading }) => {
  if (type === "ClinicVisits") {
    const clinicVisits = api.pet.getClinicsVisited?.useQuery();
    const response: { dogs: number; cats: number } = clinicVisits?.data ?? { dogs: 0, cats: 0 };

    const data = [
      { name: "Dogs", value: response.dogs },
      { name: "Cats", value: response.cats },
    ];

    //const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];   #D1D5DB
    const COLORS = ["#EB4724", "#D1D5DB"];

    const RADIAN = Math.PI / 180;
    interface LabelProps {
      cx: number;
      cy: number;
      midAngle: number;
      innerRadius: number;
      outerRadius: number;
      percent: number;
      index: number;
    }

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, payload }: LabelProps & { payload: { value: number } }) => {
      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);

      return (
        <text x={x} y={y} fill={`${index === 0 ? "white" : "black"}`} textAnchor={x > cx ? "start" : "end"} dominantBaseline="central">
          {payload.value}
        </text>
      );
    };

    const [outerRadius, setOuterRadius] = useState(80);

    useEffect(() => {
      const updateSize = () => {
        const screenWidth = window.innerWidth;
        if (screenWidth < 1500) {
          setOuterRadius(70); // smaller radius for smaller screens
        } else {
          setOuterRadius(80); // default radius
        }
      };

      window.addEventListener("resize", updateSize);
      updateSize(); // Set initial size

      return () => window.removeEventListener("resize", updateSize);
    }, []);

    isLoading = clinicVisits.isLoading;

    if (isLoading) {
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
      <ResponsiveContainer width="100%" height="100%">
        <PieChart width={300} height={300}>
          <Pie data={data} cx="50%" cy="50%" labelLine={false} label={renderCustomizedLabel} outerRadius={outerRadius} fill="#8884d8" dataKey="value">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          {/* <Legend wrapperStyle={{ color: "black" }} /> */}
          <Legend formatter={(value) => <span style={{ color: "black" }}>{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    );
  } else if (type === "Treatments") {
    const treatments = api.pet.getTreatments?.useQuery();
    const response: { dogs: number; cats: number } = treatments?.data ?? { dogs: 0, cats: 0 };

    const data = [
      { name: "Dogs", value: response.dogs },
      { name: "Cats", value: response.cats },
    ];

    //const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];   #D1D5DB
    const COLORS = ["#EB4724", "#D1D5DB"];

    const RADIAN = Math.PI / 180;
    interface LabelProps {
      cx: number;
      cy: number;
      midAngle: number;
      innerRadius: number;
      outerRadius: number;
      percent: number;
      index: number;
    }

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, payload }: LabelProps & { payload: { value: number } }) => {
      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);

      return (
        <text x={x} y={y} fill={`${index === 0 ? "white" : "black"}`} textAnchor={x > cx ? "start" : "end"} dominantBaseline="central">
          {payload.value}
        </text>
      );
    };

    const [outerRadius, setOuterRadius] = useState(80);

    useEffect(() => {
      const updateSize = () => {
        const screenWidth = window.innerWidth;
        if (screenWidth < 1500) {
          setOuterRadius(70); // smaller radius for smaller screens
        } else {
          setOuterRadius(80); // default radius
        }
      };

      window.addEventListener("resize", updateSize);
      updateSize(); // Set initial size

      return () => window.removeEventListener("resize", updateSize);
    }, []);

    if (treatments.isLoading) {
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
      <ResponsiveContainer width="100%" height="100%">
        <PieChart width={300} height={300}>
          <Pie data={data} cx="50%" cy="50%" labelLine={false} label={renderCustomizedLabel} outerRadius={outerRadius} fill="#8884d8" dataKey="value">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          {/* <Legend wrapperStyle={{ color: "black" }} /> */}
          <Legend formatter={(value) => <span style={{ color: "black" }}>{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    );
  }
};

export default PieGraph;
