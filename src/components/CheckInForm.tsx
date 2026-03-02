import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail } from "lucide-react";
import { useCustomToast } from "@/hooks/use-custom-toast";

const CheckInForm = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasDog, setHasDog] = useState(false);
  const [dogName, setDogName] = useState('');
  const [da2ppVaccine, setDa2ppVaccine] = useState(false);
  const [rabiesVaccine, setRabiesVaccine] = useState(false);
  const [bordetellaVaccine, setBordetellaVaccine] = useState(false);
  const [joinInsiderList, setJoinInsiderList] = useState(false);
  const [nextNumber, setNextNumber] = useState<number | null>(null);
  const navigate = useNavigate();
  const { toast } = useCustomToast();

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/attendee-count`)
      .then(r => r.json())
      .then(data => setNextNumber(data.count + 1))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (hasDog && (!da2ppVaccine || !rabiesVaccine || !bordetellaVaccine)) {
      toast.error({
        title: "Vaccination Required",
        description: "Please confirm all vaccination requirements for your dog.",
      });
      return;
    }

    setIsLoading(true);
    setIsSubmitting(true);

    try {
      const normalizedEmail = email.toLowerCase().trim();

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/attendees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          first_name: firstName,
          last_name: lastName,
          has_dog: hasDog,
          dog_name: hasDog ? dogName : null,
          da2pp_vaccine: hasDog ? da2ppVaccine : false,
          rabies_vaccine: hasDog ? rabiesVaccine : false,
          bordetella_vaccine: hasDog ? bordetellaVaccine : false,
          join_insider_list: joinInsiderList,
        }),
      });

      if (!res.ok) throw new Error('Failed to save attendee');

      toast.encouragement({
        title: "Welcome!",
        description: "Let's continue with your check-in.",
      });

      navigate(`/sign-waiver?email=${encodeURIComponent(normalizedEmail)}`);
    } catch (error) {
      console.error('Error:', error);
      toast.error({
        title: "Error",
        description: "An error occurred. Please try again.",
      });
      setTimeout(() => setIsSubmitting(false), 1000);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "h-14 px-4 text-base bg-white/90 border-mutts-primary/30 focus-visible:border-mutts-primary focus-visible:ring-mutts-primary rounded-xl placeholder:text-gray-400";

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      {/* Social proof — live counter */}
      <p className="text-center text-xs text-gray-400 -mt-2">
        {nextNumber !== null
          ? <>🐾 Dog enthusiast <span className="font-semibold text-mutts-primary">#{nextNumber.toLocaleString()}</span> — welcome to the Mutts fam!</>
          : <>🐾 Welcome to the Mutts fam!</>
        }
      </p>

      <div className="space-y-4">
        <Input
          type="text"
          placeholder="First Name *"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className={inputClass}
          required
          disabled={isLoading || isSubmitting}
        />

        <Input
          type="text"
          placeholder="Last Name *"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className={inputClass}
          required
          disabled={isLoading || isSubmitting}
        />

        <Input
          type="email"
          placeholder="Email Address *"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          required
          disabled={isLoading || isSubmitting}
        />

        {/* Email opt-in */}
        <div className="flex items-center space-x-2 pl-1">
          <Checkbox
            id="joinInsiderList"
            checked={joinInsiderList}
            onCheckedChange={(checked) => setJoinInsiderList(checked === true)}
            className="border-mutts-primary data-[state=checked]:bg-mutts-primary"
          />
          <label
            htmlFor="joinInsiderList"
            className="text-xs text-gray-500 cursor-pointer leading-tight"
          >
            Send me future event invites &amp; Mutts updates
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasDog"
            checked={hasDog}
            onCheckedChange={(checked) => {
              setHasDog(checked === true);
              if (!checked) {
                setDogName('');
                setDa2ppVaccine(false);
                setRabiesVaccine(false);
                setBordetellaVaccine(false);
              }
            }}
            className="border-mutts-primary data-[state=checked]:bg-mutts-primary"
          />
          <label
            htmlFor="hasDog"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            I'm bringing a dog to this event
          </label>
        </div>

        {hasDog && (
          <div className="pl-6 space-y-3 border-l-2 border-mutts-primary/20">
            <Input
              type="text"
              placeholder="Dog's Name"
              value={dogName}
              onChange={(e) => setDogName(e.target.value)}
              className={inputClass}
              disabled={isLoading || isSubmitting}
            />

            <p className="text-sm font-semibold text-mutts-primary">
              Vaccination Requirements (All Required)
            </p>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="da2pp"
                checked={da2ppVaccine}
                onCheckedChange={(checked) => setDa2ppVaccine(checked === true)}
                className="border-mutts-primary data-[state=checked]:bg-mutts-primary mt-0.5"
              />
              <label htmlFor="da2pp" className="text-sm leading-tight cursor-pointer">
                My dog is up to date on the DA2PP (Distemper, Adenovirus, Parvovirus, Parainfluenza) vaccine
              </label>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="rabies"
                checked={rabiesVaccine}
                onCheckedChange={(checked) => setRabiesVaccine(checked === true)}
                className="border-mutts-primary data-[state=checked]:bg-mutts-primary mt-0.5"
              />
              <label htmlFor="rabies" className="text-sm leading-tight cursor-pointer">
                My dog is up to date on the Rabies vaccine
              </label>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="bordetella"
                checked={bordetellaVaccine}
                onCheckedChange={(checked) => setBordetellaVaccine(checked === true)}
                className="border-mutts-primary data-[state=checked]:bg-mutts-primary mt-0.5"
              />
              <label htmlFor="bordetella" className="text-sm leading-tight cursor-pointer">
                My dog is up to date on the Bordetella (Kennel Cough) vaccine
              </label>
            </div>
          </div>
        )}
      </div>

      {/* CTA button */}
      <div className="space-y-2">
        <Button
          type="submit"
          className="w-full h-12 text-lg font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #8C81BD 0%, #6f63a8 100%)",
            boxShadow: "0 4px 18px rgba(140, 129, 189, 0.45)",
          }}
          disabled={isLoading || isSubmitting}
        >
          <Mail className="w-5 h-5 mr-2" />
          {isLoading ? "Processing..." : "Continue to Event Waiver"}
        </Button>

        {/* Trust signals */}
        <div className="flex justify-center gap-4 pt-1">
          <span className="text-xs text-gray-400">⏱ Takes less than 60 seconds</span>
          <span className="text-xs text-gray-400">🔒 Your info is never shared</span>
        </div>
      </div>
    </form>
  );
};

export default CheckInForm;
