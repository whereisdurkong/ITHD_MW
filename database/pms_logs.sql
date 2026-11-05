USE [ticket_system]
GO

/****** Object:  Table [dbo].[pms_logs]    Script Date: 11/10/2025 10:55:39 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[pms_logs](
	[log_id] [int] IDENTITY(1,1) NOT NULL,
	[pms_id] [nvarchar](100) NULL,
	[tag_id] [nvarchar](100) NULL,
	[created_by] [nvarchar](100) NULL,
	[created_at] [datetime] NULL,
	[changes_made] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[log_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[pms_logs] ADD  DEFAULT (getdate()) FOR [created_at]
GO


