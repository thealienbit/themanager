const createTimelineEntry = (action, details) => ({
  date: new Date().toISOString(),
  action,
  details
});

module.exports = { createTimelineEntry };
