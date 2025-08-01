import SearchBar from "@/components/molecules/forms/LabeledInputField";
import { Bell, Mail, Menu, Search } from "lucide-react";
import ProfileDropdown from "@/components/molecules/interactive/Dropdown";
import { useAuth } from "@/hooks/useAuth";
import LabeledInputField from "@/components/molecules/forms/LabeledInputField";

type UserRole = 'Superadmin' | 'teacher' | 'student' | 'parent';

interface NavbarProps {
  role?: UserRole;
  onMenuClick?: () => void;
  onSearchClick?: () => void;
}

export default function Navbar({ onMenuClick, onSearchClick }: NavbarProps) {
  const { role } = useAuth();
  return (
    <header className="flex justify-between items-center px-3 md:px-6  bg-white shadow-sm z-10">
      {/* Mobile Left Section - Hamburger */}
      <div className="flex items-center md:hidden">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-muted-hover text-primary transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Desktop Search Bar */}
      <div className="hidden md:flex items-center gap-3 flex-1 max-w-sm">
        <div className="flex-1">
          <LabeledInputField
            type="search"
            placeholder="Search"
            value={""}
            onChange={() => {}}
            icon={<Search className="text-primary cursor-pointer" />}
          />
        </div>
      </div>

      {/* Mobile Center - Logo */}
      <div className="flex-1 flex justify-center md:hidden">
        <div className="text-lg font-bold text-gray-800">🎓 SMS</div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Mobile Search Icon */}
        <button
          onClick={onSearchClick}
          className="md:hidden p-2 rounded-lg hover:bg-muted-hover text-primary transition-colors"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Desktop Notifications */}
        <div className="hidden sm:flex items-center gap-3">
          <Mail className="text-secondary w-5 h-5" />
          <Bell className="text-secondary w-5 h-5" />
        </div>
        <div className="hidden sm:block w-[1.5px] h-6 bg-border ml-3" />
        {/* ProfileDropdown - Desktop only */}
        <div className="hidden md:block">
          <ProfileDropdown className="mx-2 md:mx-3 my-1" />
        </div>
      </div>
    </header>
  );
}



