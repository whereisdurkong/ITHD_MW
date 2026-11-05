USE [ticket_system]
GO

/****** Object:  Table [dbo].[knowledgebase_logs]    Script Date: 11/10/2025 10:54:08 AM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[knowledgebase_logs](
	[kb_logs_id] [int] IDENTITY(1,1) NOT NULL,
	[kb_id] [nvarchar](100) NULL,
	[changes_made] [nvarchar](100) NULL,
	[created_by] [nvarchar](100) NULL,
	[created_at] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[kb_logs_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[knowledgebase_logs] ADD  DEFAULT (getdate()) FOR [created_at]
GO


