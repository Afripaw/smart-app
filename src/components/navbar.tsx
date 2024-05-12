import Link from "next/link";
import { Gauge, Users, User, Dog, FirstAidKit, Bed, Info, SignOut, Person, Envelope, GlobeHemisphereEast, EnvelopeOpen } from "phosphor-react";
import Image from "next/image";
import { signOut } from "next-auth/react";
//import { router } from "@trpc/server";
import { useRouter } from "next/router";
import { api } from "~/utils/api";

const NavbarLinks = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: <Gauge className="h-full w-full" />,
    access: ["System Administrator", "Data Analyst", "Data Consumer", "Treatment Data Capturer", "General Data Capturer"],
  },
  {
    name: "Users",
    href: "/user",
    // icon: <User size={24} />,
    icon: <User className="h-full w-full" />,
    access: ["System Administrator"],
  },
  {
    name: "Volunteers",
    href: "/volunteer",
    // icon: <Person size={24} />,
    icon: <Person className="h-full w-full" />,
    access: ["System Administrator"],
  },
  {
    name: "Owners",
    href: "/owner",
    // icon: <Users size={24} />,
    icon: <Users className="h-full w-full" />,
    access: ["System Administrator", "Data Analyst", "Treatment Data Capturer", "General Data Capturer"],
  },
  {
    name: "Pets",
    href: "/pet",
    // icon: <Dog size={24} />,
    icon: <Dog className="h-full w-full" />,
    access: ["System Administrator", "Data Analyst", "Treatment Data Capturer", "General Data Capturer"],
  },
  {
    name: "Treatments",
    href: "/treatment",
    // icon: <FirstAidKit size={24} />,
    icon: <FirstAidKit className="h-full w-full" />,
    access: ["System Administrator", "Data Analyst", "Treatment Data Capturer"],
  },
  {
    name: "Clinics",
    href: "/clinic",
    // icon: <Bed size={24} />,
    icon: <Bed className="h-full w-full" />,
    access: ["System Administrator", "Data Analyst"],
  },
  {
    name: "Geographic",
    href: "/geographic",
    // icon: <GlobeHemisphereEast size={24} />,
    icon: <GlobeHemisphereEast className="h-full w-full" />,
    access: ["System Administrator"],
  },
  {
    name: "Database",
    href: "/info",
    // icon: <Info size={24} />,
    icon: <Info className="h-full w-full" />,
    access: ["System Administrator", "Data Analyst", "Data Consumer"],
  },
  {
    name: "Messages",
    href: "/communication",
    // icon: <Envelope size={24} />,
    icon: <Envelope className="h-full w-full" />,
    access: ["System Administrator"],
  },
];

const Navbar = () => {
  const router = useRouter();

  // const handleLogout = async () => {
  //   // void router.push("/");
  //   await signOut();
  //   await router.push({
  //     pathname: "/",
  //   });
  // };
  const handleLogout = async () => {
    await signOut({ callbackUrl: `${window.location.origin}/` });
  };

  const { data: user } = api.user.getOwnUser.useQuery();

  return (
    <div className="sticky z-50 flex items-center justify-between bg-main-orange text-normal text-black xs:left-0 xs:flex-col md:top-0 md:flex-row md:p-2 md:text-xs xl:w-full xl:p-3 xl:text-normal">
      {/* <div className="justify-begin flex">
        <Image src={"/afripaw-logo.jpg"} alt="Afripaw Logo" className="ml-auto aspect-square h-max rounded-full" width={56} height={56} />
      </div> */}
      <div className="justify-begin flex">
        <Image
          src={"/afripaw-logo.jpg"}
          alt="Afripaw Logo"
          className="ml-auto aspect-square h-[3.5rem] w-[3.5rem] rounded-full md:h-[2.7rem] md:w-[2.7rem] xl:h-[3.5rem] xl:w-[3.5rem]"
          width={56}
          height={56}
        />
      </div>
      <div className="mx-auto flex items-center xs:flex-col md:flex-row md:gap-1 xl:gap-2">
        {NavbarLinks.filter((link) => link.access.includes(user?.role ?? "System Administrator")).map((link) => (
          <div key={link.name}>
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center rounded-lg hover:bg-gray-200/30 md:px-2 md:py-1 xl:px-3  xl:py-2 ${
                router.pathname === link.href ? "bg-white text-black" : "text-white"
              }`}
            >
              {/* <div className="mr-2">{link.icon}</div> */}
              <div className="h-6 w-6 md:mr-1 md:h-4 md:w-4 xl:mr-2 xl:h-6 xl:w-6">{link.icon}</div>
              {link.name}
            </Link>
          </div>
        ))}
      </div>
      <Link className="flex items-center rounded-lg px-3 py-2 text-white hover:bg-gray-200/30" href="/" onClick={handleLogout}>
        <div className="h-6 w-6 md:h-4 md:w-4 xl:h-6 xl:w-6">
          <SignOut className="h-full w-full" />
        </div>
        {/* <SignOut size={24} /> */}
        Logout
      </Link>
    </div>
  );
};

export default Navbar;
