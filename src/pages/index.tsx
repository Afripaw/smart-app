import { signIn } from "next-auth/react";
import Head from "next/head";
//import Link from "next/link";

//import { api } from "~/utils/api";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import Image from "next/image";
//import { CircularProgress } from "@mui/material";
//import CircularProgress from "@mui/joy/CircularProgress";
//import { CircularProgressbar } from "react-circular-progressbar";
//import "react-circular-progressbar/dist/styles.css";

export default function Home() {
  //const hello = api.post.hello.useQuery({ text: "from tRPC" });

  const [signIn_, setSignIn_] = useState(false);

  //For moving between different pages
  const router = useRouter();

  //passwords
  const [passwordError, setPasswordError] = useState(false);
  const [missingFields, setMissingFields] = useState(false);

  //--------------------------------LOGIN BUTTONS--------------------------------

  //handle sign in
  const handleSignIn = async () => {
    signIn_ ? setSignIn_(false) : setSignIn_(true);
  };

  const handleWelcomePage = async () => {
    setSignIn_(false);
  };

  const handleUser = async (event: FormEvent<HTMLFormElement>) => {
    setLoading(true);
    setPasswordError(false);
    setMissingFields(false);
    event.preventDefault();

    const formTarget = event.target as typeof event.target & {
      0: { value: string };
      1: { value: string };
    };

    if (!formTarget[0].value || !formTarget[1].value) {
      setMissingFields(true);
      return console.warn("Missing fields");
    } else {
      setMissingFields(false);
    }

    const result = await signIn("credentials", {
      username: formTarget[0].value,
      password: formTarget[1].value,
      redirect: false,
    });

    if (!result?.ok) {
      setLoading(false);
      //Display error message to user
      setPasswordError(true);
      return console.warn("Sign in failed");
    } else {
      setPasswordError(false);
      setLoading(true);
    }

    await router.push("/dashboard");
  };

  //-------------------------------BUSY LOADING----------------------------------
  const [loading, setLoading] = useState(false);

  return (
    <>
      <Head>
        <title>Afripaw Smart App</title>
        <meta name="description" content="Smart App" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className=" flex min-h-screen flex-col bg-gray-100">
        {!signIn_ && (
          <>
            <div className="flex grow flex-col bg-white">
              <div className="flex items-center justify-between bg-main-orange">
                <div className="justify-begin flex">
                  <Image src={"/afripaw-logo.jpg"} alt="Afripaw Logo" className="m-2 ml-2 aspect-square h-max rounded-full" width={62} height={62} />
                </div>
                <div className="text-3xl">Welcome to the Afripaw Smart App</div>
                <button
                  className=" m-2 rounded-lg border-black bg-white p-2 text-lg text-black duration-150 hover:bg-gray-200/30"
                  onClick={() => void handleSignIn()}
                >
                  Sign in
                </button>
              </div>
              <div className="flex grow flex-col items-center justify-center">
                <div className="relative my-5 flex items-center p-28 text-black">
                  <div className="absolute left-0 top-0 flex aspect-square flex-col items-center justify-center rounded-full bg-main-orange p-6 text-white">
                    <div className="text-2xl">6505</div>
                    <div>Pet Clinic visits</div>
                  </div>
                  <div className="absolute right-0 top-0 flex aspect-square flex-col items-center justify-center rounded-full bg-main-orange p-8 text-white">
                    <div className="text-2xl">752</div>
                    <div>Pets Sterilised</div>
                  </div>
                  <div className="absolute bottom-0 left-0 flex aspect-square flex-col items-center justify-center rounded-full bg-main-orange p-4 text-white">
                    <div className="text-2xl">68</div>
                    <div>Kennels Provided</div>
                  </div>
                  <div className="absolute bottom-0 right-0 flex aspect-square flex-col items-center justify-center rounded-full bg-main-orange p-5 text-white">
                    <div className="text-2xl">90</div>
                    <div>Active Volunteers</div>
                  </div>
                  <p className="w-52 border-2 border-black p-3">
                    <strong className="text-lg text-main-orange">Our Mision</strong> is to partner with low-income communities to educate families on their
                    pets’ primary needs and facilitate access to affordable support services with a focus on free mass sterilisation.
                  </p>
                  <p className="ml-5 w-52 border-2 border-black p-6 py-9">
                    <strong className="text-lg text-main-orange">Our Vision</strong> is to see communities that treasure their pets, provide for their needs,
                    and protect them from suffering and disease.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
        {signIn_ && (
          <>
            <div className="mb-2 flex flex-col bg-slate-300">
              <div className="flex grow justify-between bg-main-orange">
                <div className="justify-begin flex items-center">
                  <Image src={"/afripaw-logo.jpg"} alt="Afripaw Logo" className="m-2 ml-2 aspect-square h-max rounded-full" width={62} height={62} />
                </div>
                <div className="flex flex-col items-center justify-center py-3 pl-32 pr-5">
                  <div className=" text-3xl">Sign In</div>
                </div>
                <button className="m-3 rounded-lg border-black bg-white p-3 text-base text-black duration-150 hover:bg-gray-200/30" onClick={handleWelcomePage}>
                  Back to Welcome Page
                </button>
              </div>
            </div>
            <form className="mb-14 flex grow flex-col items-center justify-center" onSubmit={(event) => void handleUser(event)}>
              <div className="mb-5 text-lg">Enter Credentials</div>
              <input
                className={`m-2 rounded-lg border-2 border-zinc-800 px-2 ${missingFields ? "border-red-500" : ""} ${passwordError ? " border-red-500" : ""}`}
                placeholder="User ID"
                type="text"
                name="password"
                //  onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className={`m-2 rounded-lg border-2  px-2 ${missingFields ? " border-red-500" : "border-zinc-800"} 
                  ${passwordError ? " border-red-500" : "border-zinc-800"}`}
                placeholder="Password"
                type="password"
                name="password"
                // onChange={(e) => setPassword(e.target.value)}
              />
              {missingFields && <div className="text-red-500">Missing fields. Enter UserID and Password</div>}
              {passwordError && <div className="text-red-500">Incorrect User ID or Password</div>}
              <button className="mt-4 rounded-md border-black bg-main-orange px-8 py-3 text-lg text-white hover:bg-orange-500" type="submit">
                Sign in
              </button>
            </form>
          </>
        )}
        {loading && (
          <div className="absolute left-0 top-0 z-50 flex h-full w-full items-center justify-center bg-gray-200" role="status">
            <svg
              aria-hidden="true"
              className="h-20 w-20 animate-spin fill-main-orange text-gray-200 dark:text-gray-600"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
            <span className="sr-only">Loading...</span>
          </div>
        )}
      </main>
    </>
  );
}

//flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]
//<main className=" flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
//<div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">

/*<button
className="my-3 bg-red-500"
onClick={() => void handleNewUser()}
>
Sign in
</button>*/
