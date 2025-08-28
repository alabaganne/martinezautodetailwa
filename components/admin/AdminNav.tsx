import { Menu } from 'lucide-react';

interface Props {
	setSidebarOpen: () => void;
}

export default function AdminNav({ setSidebarOpen }: Props) {
	return (
		<div className="sticky top-0 z-30 flex items-center h-16 px-6 bg-white/80 backdrop-blur-md border-b-2 border-gray-200/50">
			<button
				onClick={() => setSidebarOpen()}
				className="lg:hidden text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200"
				aria-label="Open sidebar">
				<Menu size={24} />
			</button>
			<div className="flex-1" />
			<div className="flex items-center space-x-4">
				<span className="text-sm font-medium text-gray-700">Admin</span>
				<div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full" />
			</div>
		</div>
	);
}
