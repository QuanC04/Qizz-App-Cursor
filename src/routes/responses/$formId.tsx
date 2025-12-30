import { createFileRoute, useParams } from '@tanstack/react-router';
import { useEffect, useState, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useFormStore } from '../../stores/useFormStore';
import { Check, Download } from 'lucide-react';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import type { Question, Response } from '../../types';
import { exportResponsesToExcel } from '../../utils/excelUtils';

export const Route = createFileRoute('/responses/$formId')({
  component: ResponsesPage,
});

type AnswerValue = string | number | number[] | null;

interface QuestionStat {
  text: string;
  points: number;
  correctRate: string;
  options: Array<{
    label: string;
    count: number;
    isCorrect: boolean;
  }>;
  chartData: Array<{
    name: string;
    value: number;
  }>;
  type: string;
  rawAnswers: AnswerValue[];
  correctAnswers?: string[] | number | number[];
}

function ResponsesPage() {
  const { formId } = useParams({ from: '/responses/$formId' });
  const { fetchFormById, currentForm } = useFormStore();
  const [submissions, setSubmissions] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  const COLORS = ['#3b82f6', '#ec4899', '#fbbf24', '#10b981', '#8b5cf6', '#f43f5e'];

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchData = async () => {
      await fetchFormById(formId);

      try {
        const submissionsRef = collection(db, 'forms', formId, 'submissions');
        const snapshot = await getDocs(submissionsRef);
        const submissionData: Response[] = snapshot.docs.map(
          doc =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as Response
        );
        setSubmissions(submissionData);
      } catch (error) {
        console.error('Error fetching submissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [formId]);

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Đang tải...</p>
      </div>
    );
  }

  if (!currentForm) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <p className="text-red-600">Không tìm thấy form</p>
      </div>
    );
  }

  const scores = submissions.map(s => s.score || 0);
  const avgScore =
    scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : 0;

  // Calculate average completion time
  const completionTimes = submissions
    .map(s => s.timeSpent)
    .filter(t => t !== undefined && t !== null) as number[];
  const avgCompletionTime =
    completionTimes.length > 0
      ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length)
      : 0;
  const avgTimeDisplay =
    avgCompletionTime > 0
      ? `${Math.floor(avgCompletionTime / 60)}:${String(avgCompletionTime % 60).padStart(2, '0')}`
      : '0:00';

  // Statistics for each question
  const questionStats: QuestionStat[] = currentForm.questions.map((q: Question) => {
    const answers: AnswerValue[] = submissions.map(s => s.answers[q.id] ?? null);

    const total = submissions.length || 1;

    // Count correct answers
    let correctCount = 0;

    answers.forEach(ans => {
      const correct = q.correctAnswer;

      // Skip only if truly null/undefined (allow 0 as valid answer)
      if (ans === null || ans === undefined) {
        return;
      }

      if (correct === null || correct === undefined) {
        return;
      }

      if (q.type === 'radio') {
        const isCorrect = Number(ans) === Number(correct);
        if (isCorrect) correctCount++;
      } else if (q.type === 'checkbox') {
        const ansArray = Array.isArray(ans) ? (ans as number[]) : [];
        const correctArray = Array.isArray(correct) ? (correct as number[]) : [];
        const isCorrect =
          ansArray.length === correctArray.length && ansArray.every(x => correctArray.includes(x));
        if (isCorrect) {
          correctCount++;
        }
      } else if (q.type === 'text') {
        const correctArray = Array.isArray(correct) ? correct : [correct];
        const ansStr = String(ans).trim().toLowerCase();
        const isCorrect = correctArray.some(c => String(c).trim().toLowerCase() === ansStr);
        if (isCorrect) {
          correctCount++;
        }
      }
    });

    const correctRate =
      total > 0 && submissions.length > 0
        ? ((correctCount / submissions.length) * 100).toFixed(0)
        : '0';

    // Count for each option (radio/checkbox only)
    const counts =
      q.options?.map((_, i) => {
        return answers.filter(ans => {
          // Skip null/undefined answers
          if (ans === null || ans === undefined) {
            return false;
          }

          if (Array.isArray(ans)) {
            // For checkbox, check if array includes this index
            // Empty array means no selection
            return ans.includes(i);
          }

          // For radio, -1 means no selection
          if (ans === -1) {
            return false;
          }

          // Compare as numbers to handle both "0" and 0
          return Number(ans) === i;
        }).length;
      }) || [];

    const options =
      q.options?.map((opt, i) => ({
        label: opt,
        count: counts[i] || 0,
        isCorrect: Array.isArray(q.correctAnswer)
          ? (q.correctAnswer as number[]).includes(i)
          : i === q.correctAnswer,
      })) || [];

    const chartData = options.map(o => ({
      name: o.label,
      value: (o.count / total) * 100,
    }));

    return {
      text: q.content,
      points: q.points,
      correctRate,
      options,
      chartData,
      type: q.type,
      rawAnswers: answers,
      correctAnswers: q.correctAnswer,
    };
  });

  // Handle export to Excel
  const handleExportExcel = () => {
    if (!currentForm) return;
    exportResponsesToExcel(submissions as any, currentForm.questions, currentForm.title);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Kết quả biểu mẫu: {currentForm.title}</h1>
        <button
          onClick={handleExportExcel}
          disabled={submissions.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Download size={18} />
          Xuất Excel
        </button>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-600 text-sm mb-1">Số lượt nộp</p>
          <p className="text-3xl font-bold">{submissions.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-600 text-sm mb-1">Điểm trung bình</p>
          <p className="text-3xl font-bold">{avgScore}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-600 text-sm mb-1">Thời gian làm bài TB</p>
          <p className="text-3xl font-bold">{avgTimeDisplay}</p>
        </div>
      </div>

      {/* Question Statistics */}
      <div className="gap-y-6 mb-8 flex flex-col items-center">
        {questionStats.map((question, i) => (
          <div key={i} className="p-6 rounded-2xl shadow-sm bg-white w-4/5">
            <h2 className="text-lg font-medium mb-1">
              {i + 1}. {question.text}{' '}
              <span className="text-gray-500">({question.points} điểm)</span>
            </h2>

            {question.type !== 'text' && (
              <p className="text-sm text-blue-600 mb-4">
                {question.correctRate}% số người được hỏi trả lời đúng câu hỏi này.
              </p>
            )}

            {question.type === 'text' ? (
              <div className="mt-4">
                <p className="text-sm text-blue-600 mb-4">
                  {question.correctRate}% số người được hỏi trả lời đúng câu hỏi này.
                </p>
                {(() => {
                  // Filter out null/empty answers
                  const cleanedAnswers = question.rawAnswers.filter(
                    (a: any) => a !== null && a !== '' && a !== undefined
                  );

                  if (cleanedAnswers.length === 0) {
                    return <p className="text-gray-400 italic">Chưa có câu trả lời nào</p>;
                  }

                  // Count answer frequency
                  const answerCounts = cleanedAnswers.reduce(
                    (acc: Record<string, number>, answer: AnswerValue) => {
                      const answerStr = String(answer);
                      acc[answerStr] = (acc[answerStr] || 0) + 1;
                      return acc;
                    },
                    {} as Record<string, number>
                  );

                  // Prepare data for bar chart with correct answer indicators
                  const correctAnswersArray = Array.isArray(question.correctAnswers)
                    ? question.correctAnswers.map(a => String(a).trim().toLowerCase())
                    : [String(question.correctAnswers).trim().toLowerCase()];

                  const barData = Object.entries(answerCounts)
                    .filter(([_, count]) => typeof count === 'number' && count >= 1)
                    .map(([label, count]) => {
                      const isCorrect = correctAnswersArray.includes(label.trim().toLowerCase());
                      return {
                        x: label,
                        y: count,
                        isCorrect,
                      };
                    });

                  const chartOptions: ApexOptions = {
                    chart: {
                      type: 'bar',
                      height: 350,
                      toolbar: {
                        show: false,
                      },
                    },
                    plotOptions: {
                      bar: {
                        horizontal: true,
                        distributed: true,
                        barHeight: '50%',
                      },
                    },
                    colors: barData.map((item, idx) => {
                      if (item.isCorrect) return '#10b981';
                      // Use colors but skip green (#10b981) to avoid confusion with correct answers
                      const incorrectColors = [
                        '#3b82f6',
                        '#ec4899',
                        '#fbbf24',
                        '#8b5cf6',
                        '#f43f5e',
                      ];
                      return incorrectColors[idx % incorrectColors.length];
                    }),
                    dataLabels: {
                      enabled: true,
                      formatter: function (val: number) {
                        return val.toString();
                      },
                    },
                    xaxis: {
                      tickAmount: Math.max(...barData.map(item => item.y)),
                      labels: {
                        formatter: function (val: string) {
                          return Math.floor(Number(val)).toString();
                        },
                      },
                    },
                    yaxis: {
                      labels: {
                        style: {
                          fontSize: '12px',
                        },
                      },
                    },
                    tooltip: {
                      y: {
                        formatter: function (val: number) {
                          return val.toString() + ' câu trả lời';
                        },
                      },
                    },
                    legend: {
                      show: false,
                    },
                  };

                  const chartSeries = [
                    {
                      name: 'Số lượng',
                      data: barData.map(item => ({ x: item.x, y: item.y })),
                    },
                  ];

                  return (
                    <div>
                      <Chart
                        options={chartOptions}
                        series={chartSeries}
                        type="bar"
                        height={Math.max(200, barData.length * 50)}
                      />
                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded bg-green-500"></div>
                          <span>Đáp án đúng</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  {question.options.map((opt, j) => (
                    <div
                      key={j}
                      className="grid grid-cols-[20px_1fr_40px_20px] items-center gap-2 mb-2"
                    >
                      <div
                        className="w-5 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[j % COLORS.length] }}
                      />
                      <span className="truncate">{opt.label}</span>
                      <span className="text-gray-600 text-right">{opt.count}</span>
                      {opt.isCorrect && <Check className="w-4 h-4 text-green-500" />}
                    </div>
                  ))}
                </div>

                <div className="relative">
                  {(() => {
                    const pieOptions: ApexOptions = {
                      chart: {
                        type: 'donut',
                        width: 200,
                      },
                      labels: question.chartData.map(d => d.name),
                      colors: COLORS,
                      dataLabels: {
                        enabled: true,
                        formatter: function (val: number) {
                          const percent = Math.round(val);
                          return percent > 0 ? `${percent}%` : '';
                        },
                        style: {
                          fontSize: '12px',
                          fontWeight: 'bold',
                          colors: COLORS,
                        },
                        dropShadow: {
                          enabled: false,
                        },
                      },
                      plotOptions: {
                        pie: {
                          donut: {
                            size: '70%',
                          },
                          dataLabels: {
                            offset: 25,
                            minAngleToShowLabel: 5,
                          },
                        },
                      },
                      legend: {
                        show: false,
                      },
                      tooltip: {
                        y: {
                          formatter: function (val: number) {
                            return Math.round(val) + '%';
                          },
                        },
                      },
                    };

                    const pieSeries = question.chartData.map(d => d.value);

                    return (
                      <Chart options={pieOptions} series={pieSeries} type="donut" width={200} />
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
