import { signIn } from "next-auth/react";
import Head from "next/head";
//import Link from "next/link";

//import { api } from "~/utils/api";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import Image from "next/image";

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
      //Display error message to user
      setPasswordError(true);
      return console.warn("Sign in failed");
    } else {
      setPasswordError(false);
    }

    await router.push("/dashboard");
  };

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
