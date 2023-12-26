import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";

import { api } from "~/utils/api";
import { useRouter } from "next/router";
import {
  SetStateAction,
  useState,
  useEffect,
  useRef,
  use,
  FormEventHandler,
  FormEvent,
} from "react";
import { authOptions } from "~/server/auth";
import { set } from "zod";
import Image from "next/image";
//import { sign } from "crypto";

export default function Home() {
  //const hello = api.post.hello.useQuery({ text: "from tRPC" });

  const { data: session } = useSession();
  const newUser = api.user.create.useMutation();
  const deleteAll = api.user.deleteAll.useMutation();
  const newPet = api.pet.create.useMutation();
  const [signUp, setSignUp] = useState(false);
  const [signIn_, setSignIn_] = useState(false);
  //For moving between different pages
  const router = useRouter();

  //---------------------------------EDIT BOXES----------------------------------
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressStreetCode, setAddressStreetCode] = useState("");
  const [addressStreetNumber, setAddressStreetNumber] = useState("");
  const [addressSuburb, setAddressSuburb] = useState("");
  const [addressPostalCode, setAddressPostalCode] = useState("");
  const [comments, setComments] = useState("");

  //passwords
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [missingFields, setMissingFields] = useState(false);

  //--------------------------------DROPDOWN BOXES--------------------------------
  const [isGreaterAreaOpen, setIsGreaterAreaOpen] = useState(false);
  const [greaterAreaOption, setGreaterAreaOption] = useState("Greater Area");
  const greaterAreaRef = useRef<HTMLDivElement>(null);
  const btnGreaterAreaRef = useRef<HTMLButtonElement>(null);

  const [preferredCommunication, setPreferredCommunication] = useState(false);
  const [preferredOption, setPreferredCommunicationOption] = useState(
    "Preferred Communication",
  );
  const preferredCommunicationRef = useRef<HTMLDivElement>(null);
  const btnPreferredCommunicationRef = useRef<HTMLButtonElement>(null);

  const [role, setRole] = useState(false);
  const [roleOption, setRoleOption] = useState("Role");
  const roleRef = useRef<HTMLDivElement>(null);
  const btnRoleRef = useRef<HTMLButtonElement>(null);

  const [status, setStatus] = useState(false);
  const [statusOption, setStatusOption] = useState("Status");
  const statusRef = useRef<HTMLDivElement>(null);
  const btnStatusRef = useRef<HTMLButtonElement>(null);

  //GREATER AREA
  const handleToggleGreaterArea = () => {
    setIsGreaterAreaOpen(!isGreaterAreaOpen);
  };

  const handleGreaterAreaOption = (option: SetStateAction<string>) => {
    setGreaterAreaOption(option);
    setIsGreaterAreaOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        greaterAreaRef.current &&
        !greaterAreaRef.current.contains(event.target as Node) &&
        btnGreaterAreaRef.current &&
        !btnGreaterAreaRef.current.contains(event.target as Node)
      ) {
        setIsGreaterAreaOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  //PREFERRED COMMUNICATION
  const handleTogglePreferredCommunication = () => {
    setPreferredCommunication(!preferredCommunication);
  };

  const handlePreferredCommunicationOption = (
    option: SetStateAction<string>,
  ) => {
    setPreferredCommunicationOption(option);
    setPreferredCommunication(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        preferredCommunicationRef.current &&
        !preferredCommunicationRef.current.contains(event.target as Node) &&
        btnPreferredCommunicationRef.current &&
        !btnPreferredCommunicationRef.current.contains(event.target as Node)
      ) {
        setPreferredCommunication(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  //ROLE
  const handleToggleRole = () => {
    setRole(!role);
  };

  const handleRoleOption = (option: SetStateAction<string>) => {
    setRoleOption(option);
    setRole(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        roleRef.current &&
        !roleRef.current.contains(event.target as Node) &&
        btnRoleRef.current &&
        !btnRoleRef.current.contains(event.target as Node)
      ) {
        setRole(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  //STATUS
  const handleToggleStatus = () => {
    setStatus(!status);
  };

  const handleStatusOption = (option: SetStateAction<string>) => {
    setStatusOption(option);
    setStatus(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        statusRef.current &&
        !statusRef.current.contains(event.target as Node) &&
        btnStatusRef.current &&
        !btnStatusRef.current.contains(event.target as Node)
      ) {
        setStatus(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  //--------------------------------LOGIN BUTTONS--------------------------------
  //handle sign up
  const handleSignUp = async () => {
    signUp ? setSignUp(false) : setSignUp(true);
  };

  //handle sign in
  const handleSignIn = async () => {
    signIn_ ? setSignIn_(false) : setSignIn_(true);
  };

  //delete all records button
  const deleteAllRecords = async () => {
    await deleteAll.mutateAsync();
  };

  const handleWelcomePage = async () => {
    setSignIn_(false);
    setSignUp(false);
  };

  /*const handleGoogleSignIn = async () => {
    try {
      const result = await signIn();
      if (result) {
        console.log("Sign-in successful");
        void router.push("/dashboard");
      } else {
        console.log("Sign-in failed");
      }
    } catch (error) {
      console.log("Error during sign-in:", error);
    }
  };

  const handleNewUser = async () => {
    if (password != confirmPassword) {
      console.log("Passwords do not match");
      return;
    }
    if (greaterAreaOption === "Greater Area") {
      setGreaterAreaOption(" ");
    }
    if (preferredOption === "Preferred Communication") {
      setPreferredCommunicationOption(" ");
    }
    if (roleOption === "Role") {
      setRoleOption(" ");
    }
    if (statusOption === "Status") {
      setStatusOption(" ");
    }

    if (newUser) {
      void router.push("/dashboard");
    } else {
      console.log("error");
    }
  };*/

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

  const handleNewPet = async () => {
    await newPet.mutateAsync({
      petName: "Dixie",
      species: "Dog",
      sex: "Male",
      age: "6",
      breed: "Golden Retriever",
      colour: "Blue",
      markings: "Big green circle on the face",
      status: "Active",
      sterilisedStatus: "Yes",
      sterilisedRequested: "Yes",
      sterilisedRequestSigned: "Yes",
      vaccinatedStatus: "Yes",
      treatments: "Tender Love and Care",
      clinicsAttended: ["Vet Clinic", "Soweto Vet"],
      lastDeWorming: "2021-08-01",
      membership: "Golden",
      cardStatus: "True",
      kennelReceived: "Yes",
      comments: "Very happy dog",
    });
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
                  <Image
                    src={"/afripaw-logo.jpg"}
                    alt="Afripaw Logo"
                    className="m-2 ml-2 aspect-square h-max rounded-full"
                    width={62}
                    height={62}
                  />
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
                {/*<div className=" flex grow flex-col items-center">
                  <Image
                    className="mb-3 rounded-lg border-2 border-black px-2"
                    src={"/login-image1.png"}
                    alt="first login image"
                    width={448}
                    height={310}
                  />
                  <Image
                    className="rounded-lg border-2 border-black px-2"
                    src={"/login-image3.png"}
                    alt="first login image"
                    width={448}
                    height={310}
                  />
        </div>*/}
                {/*<div className="flex flex-col items-center">
                  <Image
                    className="mt-3"
                    src={"/login-graph2.png"}
                    alt="first login graph"
                    width={448}
                    height={260}
      />*/}
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
                    <strong className="text-lg text-main-orange">
                      Our Mision
                    </strong>{" "}
                    is to partner with low-income communities to educate
                    families on their pets’ primary needs and facilitate access
                    to affordable support services with a focus on free mass
                    sterilisation.
                  </p>
                  <p className="ml-5 w-52 border-2 border-black p-6 py-9">
                    <strong className="text-lg text-main-orange">
                      Our Vision
                    </strong>{" "}
                    is to see communities that treasure their pets, provide for
                    their needs, and protect them from suffering and disease.
                  </p>
                </div>
                {/* <Image
                    className="mt-2"
                    src={"/login-graph1.png"}
                    alt="first login graph"
                    width={448}
                    height={260}
                  />
    </div>*/}
                {/*<div className=" flex grow flex-col items-center">
                  <Image
                    className="mb-3 rounded-lg border-2 border-black px-2"
                    src={"/login-image4.png"}
                    alt="first login image"
                    width={448}
                    height={310}
                  />
                  <Image
                    className="rounded-lg border-2 border-black px-2"
                    src={"/login-image2.png"}
                    alt="first login image"
                    width={448}
                    height={310}
                  />
  </div>*/}
              </div>
            </div>
          </>
        )}
        {signIn_ && !signUp && (
          <>
            <div className="mb-2 flex flex-col bg-slate-300">
              <div className="flex grow justify-between bg-main-orange">
                <div className="justify-begin flex items-center">
                  <Image
                    src={"/afripaw-logo.jpg"}
                    alt="Afripaw Logo"
                    className="m-2 ml-2 aspect-square h-max rounded-full"
                    width={62}
                    height={62}
                  />
                </div>
                <div className="flex flex-col items-center justify-center py-3 pl-32 pr-5">
                  <div className=" text-3xl">Sign In</div>
                </div>
                <button
                  className="m-3 rounded-lg border-black bg-white p-3 text-base text-black duration-150 hover:bg-gray-200/30"
                  onClick={handleWelcomePage}
                >
                  Back to Welcome Page
                </button>
                {/*<button
                  className=" my-6 ml-3 mr-3 rounded-lg bg-white p-2"
                  onClick={handleGoogleSignIn}
                >
                  Sign In with Google
        </button>*/}
              </div>
            </div>
            <form
              className="mb-14 flex grow flex-col items-center justify-center"
              onSubmit={(event) => void handleUser(event)}
            >
              <div className="mb-5 text-lg">Enter Credentials</div>
              <input
                className={`m-2 rounded-lg border-2 border-zinc-800 px-2 ${
                  missingFields ? "border-red-500" : ""
                } ${passwordError ? " border-red-500" : ""}`}
                placeholder="User ID"
                type="text"
                name="password"
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className={`m-2 rounded-lg border-2  px-2 ${
                  missingFields ? " border-red-500" : "border-zinc-800"
                } 
                  ${passwordError ? " border-red-500" : "border-zinc-800"}`}
                placeholder="Password"
                type="password"
                name="password"
                onChange={(e) => setPassword(e.target.value)}
              />
              {missingFields && (
                <div className="text-red-500">
                  Missing fields. Enter UserID and Password
                </div>
              )}
              {passwordError && (
                <div className="text-red-500">
                  Incorrect User ID or Password
                </div>
              )}
              <button
                className="mt-4 rounded-md border-black bg-main-orange px-8 py-3 text-lg text-white hover:bg-orange-500"
                type="submit"
              >
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
