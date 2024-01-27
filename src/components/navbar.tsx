import Link from "next/link";
import { Gauge, Users, User, Dog, FirstAidKit, Bed, Info, SignOut, Person } from "phosphor-react";
import Image from "next/image";
//import { signOut } from "next-auth/react";
//import { router } from "@trpc/server";
import { useRouter } from "next/router";

const NavbarLinks = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: <Gauge size={24} />,
  },
  {
    name: "Users",
    href: "/user",
    icon: <User size={24} />,
  },
  {
    name: "Volunteers",
    href: "/volunteer",
    icon: <Person size={24} />,
  },
  {
    name: "Owners",
    href: "/owner",
    icon: <Users size={24} />,
  },
  {
    name: "Pets",
    href: "/pet",
    icon: <Dog size={24} />,
  },
  {
    name: "Treatments",
    href: "/treatment",
    icon: <FirstAidKit size={24} />,
  },
  {
    name: "Clinics",
    href: "/clinic",
    icon: <Bed size={24} />,
  },
  {
    name: "Database",
    href: "/info",
    icon: <Info size={24} />,
  },
];

const Navbar = () => {
  const router = useRouter();

  const handleLogout = () => {
    void router.push("/");
    //void signOut();
  };
  return (
    <div className=" sticky top-0 z-20 flex grow items-center justify-between bg-main-orange p-3 text-black">
      <div className="justify-begin flex">
        <Image src={"/afripaw-logo.jpg"} alt="Afripaw Logo" className="ml-auto aspect-square h-max rounded-full" width={56} height={56} />
      </div>
      <div className="mx-auto flex items-center gap-4">
        {NavbarLinks.map((link) => (
          <div key={link.name}>
            <Link
              key={link.name}
              href={link.href}
              className={`flex rounded-lg px-6 py-2 text-black hover:bg-gray-200/30 ${router.pathname === link.href ? "bg-white" : ""}`}
            >
              <div className="mr-2">{link.icon}</div>
              {link.name}
            </Link>
          </div>
        ))}
      </div>
      <Link className="flex rounded-lg px-6 py-2 text-black hover:bg-gray-200/30" href="/" onClick={handleLogout}>
        <SignOut size={24} />
        Logout
      </Link>
    </div>
  );
};

export default Navbar;
