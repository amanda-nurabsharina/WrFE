import * as React from "react";
import {
  Form,
  FormButton,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "../../components/forms";
import { useLoginForm } from "./useLoginForm";
import { Mail, Lock, HelpCircle, Eye, EyeOff } from "lucide-react";

export const Login = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const {
    form,
    form: {
      formState: { isSubmitting },
    },
    handleSubmit,
  } = useLoginForm({ defaultValues: { email: "", password: "" } });

  return (
    <div className="w-full max-w-md bg-transparent transition-all duration-300">
      <Form {...form}>
        <form
          className="grid gap-6"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-2 text-center mb-4">
            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Hi, Welcome
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
              Please login to Warehouse Dashboard
            </p>
          </div>

          <div className="grid gap-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="grid gap-1.5">
                  <FormLabel htmlFor="email" className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Email
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="example@mail.com"
                        className="pl-12 pr-12 h-12 border-zinc-200 dark:border-zinc-800 focus-visible:ring-indigo-500 rounded-xl bg-white dark:bg-zinc-900 text-sm font-medium"
                        {...field}
                      />
                      <HelpCircle className="absolute right-4 top-3.5 h-5 w-5 text-zinc-400 cursor-pointer hover:text-zinc-600" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="grid gap-1.5">
                  <FormLabel htmlFor="password" className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-12 pr-12 h-12 border-zinc-200 dark:border-zinc-800 focus-visible:ring-indigo-500 rounded-xl bg-white dark:bg-zinc-900 text-sm font-medium"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-3.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 focus:outline-none"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormButton
              className="w-full mt-2 h-12 bg-[#ebebfc] hover:bg-[#e0e2ff] dark:bg-indigo-950 dark:hover:bg-indigo-900 text-[#4f46e5] dark:text-indigo-200 font-bold rounded-xl transition-all duration-200 shadow-none border-none"
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              Log In
            </FormButton>

            <div className="flex items-center justify-between text-sm mt-1">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-600 dark:text-zinc-300 font-medium">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Remember me</span>
              </label>
            </div>
          </div>

          <div className="text-center text-xs text-zinc-400 dark:text-zinc-500 mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-900">
            Use <span className="font-semibold text-zinc-600 dark:text-zinc-300">superadmin@warehouse.com</span> & <span className="font-semibold text-zinc-600 dark:text-zinc-300">superadmin12345</span> to login.
          </div>
        </form>
      </Form>
    </div>
  );
};
