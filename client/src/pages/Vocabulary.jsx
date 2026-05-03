import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookMarked,
  Heart,
  HeartOff,
  ChevronDown,
  ChevronUp,
  Brain,
  RefreshCw,
  Trophy,
  X,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getTodayVocabulary,
  getFavourites,
  addFavourite,
  removeFavourite,
} from "../api/vocabulary";

const DIFFICULTIES = ["basic", "intermediate", "advanced"];

export default function Vocabulary() {
  const [difficulty, setDifficulty] = useState("intermediate");
  const [mode, setMode] = useState("cards"); // cards | quiz | favourites
  const [expandedWord, setExpandedWord] = useState(null);
  const queryClient = useQueryClient();

  const {
    data: vocab,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["vocabulary", difficulty],
    queryFn: () => getTodayVocabulary(difficulty).then((r) => r.data),
    staleTime: 1000 * 60 * 60, // cache 1 hour
  });

  const { data: favourites = [] } = useQuery({
    queryKey: ["favourites"],
    queryFn: () => getFavourites().then((r) => r.data),
  });

  const favouriteWords = new Set(favourites.map((f) => f.word));

  const { mutate: saveFavourite } = useMutation({
    mutationFn: addFavourite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favourites"] });
      toast.success("Added to favourites!");
    },
  });

  const { mutate: deleteFavourite } = useMutation({
    mutationFn: removeFavourite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favourites"] });
      toast.success("Removed from favourites");
    },
  });

  const toggleFavourite = (word) => {
    if (favouriteWords.has(word.word)) {
      deleteFavourite(word.word);
    } else {
      saveFavourite(word);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Vocabulary
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            10 new words every day · AI powered
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        {/* Difficulty */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                difficulty === d
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {[
            { id: "cards", label: "Flashcards", icon: BookMarked },
            { id: "quiz", label: "Quiz", icon: Brain },
            { id: "favourites", label: "Saved", icon: Heart },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                mode === id
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
              }`}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {mode === "cards" && (
        <FlashcardsMode
          vocab={vocab}
          isLoading={isLoading}
          isError={isError}
          favouriteWords={favouriteWords}
          expandedWord={expandedWord}
          setExpandedWord={setExpandedWord}
          onToggleFavourite={toggleFavourite}
          difficulty={difficulty}
        />
      )}

      {mode === "quiz" && (
        <QuizMode quiz={vocab?.quiz ?? []} isLoading={isLoading} />
      )}

      {mode === "favourites" && (
        <FavouritesMode
          favourites={favourites}
          expandedWord={expandedWord}
          setExpandedWord={setExpandedWord}
          onRemove={(word) => deleteFavourite(word)}
        />
      )}
    </div>
  );
}

// ---- Flashcards Mode ----
function FlashcardsMode({
  vocab,
  isLoading,
  isError,
  favouriteWords,
  expandedWord,
  setExpandedWord,
  onToggleFavourite,
  difficulty,
}) {
  const diffColors = {
    basic: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10",
    intermediate: "text-amber-500   bg-amber-50   dark:bg-amber-500/10",
    advanced: "text-red-500     bg-red-50     dark:bg-red-500/10",
  };

  if (isLoading) {
    return (
      <div className="card text-center py-16">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
          Generating today's vocabulary...
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          This takes a few seconds on first load
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          Failed to load vocabulary
        </p>
        <p className="text-xs text-gray-400 mt-1 mb-4">
          Check your API key or try again
        </p>
        <button className="btn-primary text-sm flex items-center gap-2 mx-auto">
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {vocab?.words?.map((word, i) => {
        const isExpanded = expandedWord === word.word;
        const isFav = favouriteWords.has(word.word);

        return (
          <div
            key={word.word}
            className="card hover:border-primary-200 dark:hover:border-primary-800 transition-colors"
          >
            {/* Word header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="text-xs font-bold text-gray-300 dark:text-gray-600 mt-1 w-5 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white capitalize">
                      {word.word}
                    </h3>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${diffColors[difficulty]}`}
                    >
                      {difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                    {word.meaning}
                  </p>
                  <p className="text-sm font-medium text-primary-500 mt-0.5">
                    {word.bangla}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onToggleFavourite(word)}
                  className={`transition-colors ${
                    isFav
                      ? "text-red-400 hover:text-red-500"
                      : "text-gray-300 dark:text-gray-600 hover:text-red-400"
                  }`}
                  title={
                    isFav ? "Remove from favourites" : "Save to favourites"
                  }
                >
                  <Heart size={16} fill={isFav ? "currentColor" : "none"} />
                </button>
                <button
                  onClick={() => setExpandedWord(isExpanded ? null : word.word)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Expanded details */}
            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                {/* Synonyms & Antonyms */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                      Synonyms
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {word.synonyms.map((s) => (
                        <span
                          key={s}
                          className="text-xs bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                      Antonyms
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {word.antonyms.length > 0 ? (
                        word.antonyms.map((a) => (
                          <span
                            key={a}
                            className="text-xs bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 px-2 py-0.5 rounded-full"
                          >
                            {a}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mnemonic */}
                <div className="bg-amber-50 dark:bg-amber-500/10 rounded-lg px-4 py-3">
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
                    💡 Memory trick
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {word.mnemonic}
                  </p>
                </div>

                {/* Example sentence */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    📝 Example
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                    "{word.sentence}"
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---- Quiz Mode ----
function QuizMode({ quiz, isLoading }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const reset = () => {
    setCurrent(0);
    setSelected(null);
    setSubmitted(false);
    setScore(0);
    setFinished(false);
  };

  if (isLoading) {
    return (
      <div className="card text-center py-16">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!quiz.length) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          Load flashcards first to unlock the quiz
        </p>
      </div>
    );
  }

  if (finished) {
    const pct = Math.round((score / quiz.length) * 100);
    return (
      <div className="card text-center py-12 space-y-4">
        <Trophy
          size={48}
          className={`mx-auto ${pct >= 80 ? "text-amber-400" : pct >= 50 ? "text-primary-400" : "text-gray-400"}`}
        />
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {score} / {quiz.length}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {pct >= 80
              ? "Excellent work! 🎉"
              : pct >= 50
                ? "Good effort! Keep going 💪"
                : "Keep practicing! 📚"}
          </p>
        </div>
        {/* Score bar */}
        <div className="max-w-xs mx-auto">
          <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                pct >= 80
                  ? "bg-emerald-500"
                  : pct >= 50
                    ? "bg-primary-500"
                    : "bg-amber-500"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {pct}% correct
          </p>
        </div>
        <button
          onClick={reset}
          className="btn-primary mx-auto flex items-center gap-2"
        >
          <RefreshCw size={14} /> Try again
        </button>
      </div>
    );
  }

  const q = quiz[current];
  const isCorrect = selected === q.correctAnswer;

  const handleSubmit = () => {
    if (!selected) return;
    setSubmitted(true);
    if (selected === q.correctAnswer) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (current + 1 >= quiz.length) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setSubmitted(false);
    }
  };

  return (
    <div className="card space-y-5">
      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
          <span>
            Question {current + 1} of {quiz.length}
          </span>
          <span>Score: {score}</span>
        </div>
        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-300"
            style={{ width: `${(current / quiz.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div>
        <p className="text-xs font-semibold text-primary-500 uppercase tracking-wide mb-2">
          About: {q.word}
        </p>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {q.question}
        </h3>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {q.options.map((option) => {
          let style =
            "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-500/10";

          if (submitted) {
            if (option === q.correctAnswer) {
              style =
                "border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
            } else if (option === selected) {
              style =
                "border-red-400 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400";
            }
          } else if (option === selected) {
            style =
              "border-primary-400 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400";
          }

          return (
            <button
              key={option}
              onClick={() => !submitted && setSelected(option)}
              disabled={submitted}
              className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${style}`}
            >
              <div className="flex items-center justify-between">
                <span>{option}</span>
                {submitted && option === q.correctAnswer && (
                  <Check size={16} className="text-emerald-500" />
                )}
                {submitted &&
                  option === selected &&
                  option !== q.correctAnswer && (
                    <X size={16} className="text-red-500" />
                  )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {submitted && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            isCorrect
              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"
          }`}
        >
          {isCorrect
            ? "✅ Correct!"
            : `❌ The correct answer is: ${q.correctAnswer}`}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={!selected}
            className="btn-primary"
          >
            Submit
          </button>
        ) : (
          <button onClick={handleNext} className="btn-primary">
            {current + 1 >= quiz.length ? "See results" : "Next →"}
          </button>
        )}
      </div>
    </div>
  );
}

// ---- Favourites Mode ----
function FavouritesMode({
  favourites,
  expandedWord,
  setExpandedWord,
  onRemove,
}) {
  if (favourites.length === 0) {
    return (
      <div className="card text-center py-12">
        <Heart
          size={40}
          className="mx-auto text-gray-300 dark:text-gray-600 mb-3"
        />
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          No saved words yet
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Hit the heart icon on any word to save it here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {favourites.map((word) => {
        const isExpanded = expandedWord === word.word;
        return (
          <div key={word.word} className="card">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white capitalize">
                    {word.word}
                  </h3>
                  <span className="text-xs text-gray-400 capitalize">
                    ({word.difficulty})
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                  {word.meaning}
                </p>
                <p className="text-sm font-medium text-primary-500 mt-0.5">
                  {word.bangla}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onRemove(word.word)}
                  className="text-red-400 hover:text-red-500 transition-colors"
                >
                  <HeartOff size={16} />
                </button>
                <button
                  onClick={() => setExpandedWord(isExpanded ? null : word.word)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {isExpanded ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Synonyms
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {word.synonyms.map((s) => (
                        <span
                          key={s}
                          className="text-xs bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Antonyms
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {word.antonyms?.length > 0 ? (
                        word.antonyms.map((a) => (
                          <span
                            key={a}
                            className="text-xs bg-red-50 dark:bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full"
                          >
                            {a}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-500/10 rounded-lg px-4 py-3">
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
                    💡 Memory trick
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {word.mnemonic}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3">
                  <p className="text-xs font-semibold text-gray-500 mb-1">
                    📝 Example
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                    "{word.sentence}"
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
