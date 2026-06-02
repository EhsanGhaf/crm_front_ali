import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export const confirmAlert = async (
  title: string, 
  text: string, 
  confirmText = "بله، مطمئنم", 
  cancelText = "انصراف",
  isDanger = true 
) => {
  return await MySwal.fire({
    title: title,
    text: text,
    icon: isDanger ? 'warning' : 'question',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    buttonsStyling: false, 
    customClass: {
      popup: 'rounded-[2rem] p-6 border border-slate-100 shadow-2xl',
      title: 'text-xl font-black text-slate-800 font-sans',
      htmlContainer: 'text-slate-500 font-medium text-sm font-sans',
      actions: 'flex gap-3 mt-6 w-full justify-center',
      confirmButton: `px-6 py-3 rounded-xl text-sm font-bold shadow-md transition ${isDanger ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'}`,
      cancelButton: 'px-6 py-3 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 transition',
    },
  });
};