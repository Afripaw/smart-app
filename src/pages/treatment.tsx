import { type NextPage } from "next";
import Head from "next/head";
//import { useState } from "react";
//import { api } from "~/utils/api";
import Navbar from "../components/navbar";

const Treatment: NextPage = () => {
  return (
    <>
      <Head>
        <title>Pet Treatment</title>
      </Head>
      <main className="">
        <Navbar />
      </main>
    </>
  );
};

export default Treatment;
