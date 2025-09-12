import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Download,
  Eye,
  Trash2,
  X
} from 'lucide-react';
import apiService from '../services/apiService';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobLogs, setJobLogs] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsData, jobsData] = await Promise.all([
        apiService.getStats(),
        apiService.getJobs()
      ]);
      setStats(statsData);
      setJobs(jobsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const viewJobLogs = async (jobId) => {
    try {
      const logs = await apiService.getJobLogs(jobId);
      setJobLogs(logs);
      setSelectedJob(jobId);
    } catch (error) {
      console.error('Failed to load job logs:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'running':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center">
        <motion.div
          className="flex items-center gap-3 text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span className="text-lg">Loading dashboard...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white py-8">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <motion.h1
            className="text-4xl font-bold"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Analytics Dashboard
          </motion.h1>
          <motion.button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-2 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </motion.button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <span className="text-2xl font-bold">{stats.total_jobs}</span>
              </div>
              <h3 className="text-lg font-semibold mb-1">Total Jobs</h3>
              <p className="text-blue-200 text-sm">All analysis jobs</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <span className="text-2xl font-bold">{stats.completed_jobs}</span>
              </div>
              <h3 className="text-lg font-semibold mb-1">Completed</h3>
              <p className="text-blue-200 text-sm">Successfully finished</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
                <span className="text-2xl font-bold">{stats.success_rate}%</span>
              </div>
              <h3 className="text-lg font-semibold mb-1">Success Rate</h3>
              <p className="text-blue-200 text-sm">Job completion rate</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-yellow-400" />
                </div>
                <span className="text-2xl font-bold">{stats.available_dictionaries}</span>
              </div>
              <h3 className="text-lg font-semibold mb-1">Dictionaries</h3>
              <p className="text-blue-200 text-sm">Available for analysis</p>
            </div>
          </motion.div>
        )}

        {/* Jobs Table */}
        <motion.div
          className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="p-6 border-b border-white/10">
            <h2 className="text-2xl font-semibold">Recent Jobs</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Job ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Progress</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Created</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {jobs.map((job, index) => (
                  <motion.tr
                    key={job.job_id}
                    className="hover:bg-white/5 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm">{job.job_id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-sm">
                        {job.job_type || 'analysis'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-2 px-2 py-1 rounded text-sm border ${getStatusColor(job.status)}`}>
                        {getStatusIcon(job.status)}
                        <span className="capitalize">{job.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${job.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-blue-200 mt-1">{job.progress || 0}%</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-200">
                      {formatDate(job.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewJobLogs(job.job_id)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          title="View Logs"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {job.status === 'completed' && (
                          <button
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Download Results"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                          title="Delete Job"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {jobs.length === 0 && (
            <div className="p-8 text-center text-blue-200">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No jobs found. Start your first analysis!</p>
            </div>
          )}
        </motion.div>

        {/* Job Logs Modal */}
        {selectedJob && jobLogs && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setSelectedJob(null)}
          >
            <motion.div
              className="bg-gray-900 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Job Logs: {selectedJob}</h3>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {jobLogs.logs.map((log, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-white/5 rounded-lg"
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      log.level === 'ERROR' ? 'bg-red-400' :
                      log.level === 'SUCCESS' ? 'bg-green-400' :
                      'bg-blue-400'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-blue-300">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          log.level === 'ERROR' ? 'bg-red-500/20 text-red-300' :
                          log.level === 'SUCCESS' ? 'bg-green-500/20 text-green-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {log.level}
                        </span>
                      </div>
                      <p className="text-sm">{log.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;